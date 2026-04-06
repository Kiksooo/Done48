"use server";

import {
  DisputeStatus,
  NotificationKind,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProposalStatus,
  Role,
  VisibilityType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import {
  adminAcceptProposalSchema,
  adminAssignExecutorSchema,
  adminSetOrderStatusSchema,
  customerOrderActionSchema,
} from "@/schemas/order";
import { appendStatusHistory } from "@/server/orders/status";
import {
  createNotification,
  createNotificationsForUsers,
  notifySafe,
} from "@/server/notifications/service";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { writeAuditLog } from "@/server/audit/log";
import type { ActionResult } from "./create-order";

const ESCROW_REQUIRED_MSG =
  "Сначала заказчик должен зарезервировать сумму заказа под безопасную сделку (карточка заказа → резерв с баланса).";

const ACTIVE_DISPUTE: DisputeStatus[] = [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW];

async function requireAdmin() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) return null;
  return user;
}

export async function adminPublishOrder(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.status !== OrderStatus.NEW && order.status !== OrderStatus.ON_MODERATION) {
    return { ok: false, error: "Публикация недоступна для текущего статуса" };
  }

  let customerId = "";
  let orderTitle = "";
  let fromStatus: OrderStatus = order.status;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord) {
          throw new Error("NOT_FOUND");
        }
        const publishable: OrderStatus[] = [OrderStatus.NEW, OrderStatus.ON_MODERATION];
        if (!publishable.includes(ord.status)) {
          throw new Error("BAD_STATUS");
        }
        const ou = await tx.order.updateMany({
          where: { id: orderId, status: { in: publishable } },
          data: { status: OrderStatus.PUBLISHED },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }
        fromStatus = ord.status;
        customerId = ord.customerId;
        orderTitle = ord.title;
        await appendStatusHistory(tx, {
          orderId,
          fromStatus: ord.status,
          toStatus: OrderStatus.PUBLISHED,
          actorUserId: admin.id,
          note: "Опубликовано админом",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "BAD_STATUS" || msg === "STATE") {
      return { ok: false, error: "Публикация недоступна для текущего статуса" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_PUBLISH",
    entityType: "Order",
    entityId: orderId,
    oldValue: { status: fromStatus },
    newValue: { status: OrderStatus.PUBLISHED },
  });

  revalidateOrderPaths(orderId);

  notifySafe(async () => {
    await createNotification({
      userId: customerId,
      kind: NotificationKind.ORDER_PUBLISHED,
      title: "Заказ опубликован",
      body: `«${orderTitle}» доступен специалистам`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}

export async function adminAssignExecutorAction(
  raw: unknown,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminAssignExecutorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const { orderId, executorUserId } = parsed.data;

  const [order, executor] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId } }),
    prisma.user.findFirst({
      where: { id: executorUserId, role: Role.EXECUTOR, isActive: true },
    }),
  ]);

  if (!order) return { ok: false, error: "Заказ не найден" };
  if (!executor) return { ok: false, error: "Специалист не найден" };

  if (order.executorId === executorUserId && order.status === OrderStatus.ASSIGNED) {
    return { ok: true };
  }
  if (order.executorId && order.executorId !== executorUserId) {
    return { ok: false, error: "У заказа уже другой специалист" };
  }

  const assignable: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.ON_MODERATION,
    OrderStatus.PUBLISHED,
    OrderStatus.ASSIGNED,
  ];
  if (!assignable.includes(order.status)) {
    return { ok: false, error: "Назначение недоступно для текущего статуса" };
  }

  if (order.paymentStatus !== PaymentStatus.RESERVED) {
    return { ok: false, error: ESCROW_REQUIRED_MSG };
  }

  type AssignOut =
    | { kind: "noop" }
    | {
        kind: "ok";
        fromStatus: OrderStatus;
        prevExecutorId: string | null;
        customerId: string;
        title: string;
      };

  let assignResult!: AssignOut;

  try {
    assignResult = await prisma.$transaction(
      async (tx): Promise<AssignOut> => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord) {
          throw new Error("NOT_FOUND");
        }
        if (ord.executorId === executorUserId && ord.status === OrderStatus.ASSIGNED) {
          return { kind: "noop" };
        }
        if (ord.executorId && ord.executorId !== executorUserId) {
          throw new Error("OTHER_EXEC");
        }
        if (!assignable.includes(ord.status)) {
          throw new Error("BAD_STATUS");
        }
        if (ord.paymentStatus !== PaymentStatus.RESERVED) {
          throw new Error("NEED_ESCROW");
        }

        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            OR: [{ executorId: null }, { executorId: executorUserId }],
            status: { in: assignable },
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: {
            executorId: executorUserId,
            status: OrderStatus.ASSIGNED,
            assignedByAdmin: true,
          },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }

        await tx.assignment.create({
          data: {
            orderId,
            executorId: executorUserId,
            assignedByAdminUserId: admin.id,
          },
        });

        await appendStatusHistory(tx, {
          orderId,
          fromStatus: ord.status,
          toStatus: OrderStatus.ASSIGNED,
          actorUserId: admin.id,
          note: "Назначен специалист админом",
        });

        const chat = await tx.chat.findUnique({ where: { orderId } });
        if (chat) {
          await tx.chatMember.upsert({
            where: { chatId_userId: { chatId: chat.id, userId: executorUserId } },
            create: { chatId: chat.id, userId: executorUserId },
            update: {},
          });
        }

        return {
          kind: "ok",
          fromStatus: ord.status,
          prevExecutorId: ord.executorId,
          customerId: ord.customerId,
          title: ord.title,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 25_000,
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "OTHER_EXEC") {
      return { ok: false, error: "У заказа уже другой специалист" };
    }
    if (msg === "BAD_STATUS" || msg === "STATE") {
      return { ok: false, error: "Назначение недоступно для текущего статуса" };
    }
    if (msg === "NEED_ESCROW") {
      return { ok: false, error: ESCROW_REQUIRED_MSG };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  if (assignResult.kind === "noop") {
    return { ok: true };
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_ASSIGN_EXECUTOR",
    entityType: "Order",
    entityId: orderId,
    oldValue: { status: assignResult.fromStatus, executorId: assignResult.prevExecutorId },
    newValue: { status: OrderStatus.ASSIGNED, executorId: executorUserId },
  });

  revalidateOrderPaths(orderId);

  notifySafe(async () => {
    await createNotificationsForUsers([assignResult.customerId, executorUserId], {
      kind: NotificationKind.EXECUTOR_ASSIGNED,
      title: "Специалист назначен",
      body: `Заказ: ${assignResult.title}`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}

/** До начала работы специалистом: как у заказчика — заказ снова в поиске, отклики восстанавливаются. */
export async function adminUnassignExecutorAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const orderId = parsed.data.orderId;

  const orderPre = await prisma.order.findUnique({ where: { id: orderId } });
  if (!orderPre) return { ok: false, error: "Заказ не найден" };
  if (orderPre.status !== OrderStatus.ASSIGNED) {
    return {
      ok: false,
      error: "Снять специалиста можно только пока заказ «Назначен» и работа ещё не начата.",
    };
  }
  if (!orderPre.executorId) {
    return { ok: false, error: "Специалист не назначен" };
  }
  if (orderPre.paymentStatus !== PaymentStatus.RESERVED) {
    return { ok: false, error: "Снятие назначения недоступно в текущем платёжном статусе" };
  }

  const activeDispute = await prisma.dispute.findFirst({
    where: { orderId, status: { in: ACTIVE_DISPUTE } },
    select: { id: true },
  });
  if (activeDispute) {
    return { ok: false, error: "Нельзя снять специалиста, пока открыт спор" };
  }

  const formerExecutorId = orderPre.executorId;
  const customerId = orderPre.customerId;
  const orderTitle = orderPre.title;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord) {
          throw new Error("NOT_FOUND");
        }
        if (
          ord.status !== OrderStatus.ASSIGNED ||
          !ord.executorId ||
          ord.executorId !== formerExecutorId ||
          ord.paymentStatus !== PaymentStatus.RESERVED
        ) {
          throw new Error("STATE");
        }

        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            executorId: formerExecutorId,
            status: OrderStatus.ASSIGNED,
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: {
            executorId: null,
            status: OrderStatus.PUBLISHED,
            visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
            assignedByAdmin: false,
          },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }

        await tx.proposal.updateMany({
          where: {
            orderId,
            status: { in: [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED] },
          },
          data: { status: ProposalStatus.PENDING },
        });

        const chat = await tx.chat.findUnique({ where: { orderId } });
        if (chat) {
          await tx.chatMember.deleteMany({
            where: { chatId: chat.id, userId: formerExecutorId },
          });
        }

        await appendStatusHistory(tx, {
          orderId,
          fromStatus: OrderStatus.ASSIGNED,
          toStatus: OrderStatus.PUBLISHED,
          actorUserId: admin.id,
          note: "Назначение специалиста снято администратором",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "STATE") {
      return {
        ok: false,
        error: "Снять специалиста сейчас нельзя (возможно, специалист уже начал работу). Обновите страницу.",
      };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_ADMIN_UNASSIGN_EXECUTOR",
    entityType: "Order",
    entityId: orderId,
    oldValue: { status: OrderStatus.ASSIGNED, executorId: formerExecutorId },
    newValue: { status: OrderStatus.PUBLISHED, executorId: null },
  });

  revalidateOrderPaths(orderId);

  notifySafe(async () => {
    await createNotification({
      userId: formerExecutorId,
      kind: NotificationKind.GENERIC,
      title: "Назначение по заказу отменено",
      body: `Администратор снял вас с задачи «${orderTitle}». Заказ снова открыт для откликов; резерв суммы у заказчика под заказ сохраняется по правилам площадки.`,
      link: `/orders/${orderId}`,
    });
    await createNotification({
      userId: customerId,
      kind: NotificationKind.GENERIC,
      title: "Специалист снят администратором",
      body: `По заказу «${orderTitle}» назначение снято. Заказ снова в поиске специалиста; резерв суммы под заказ сохраняется до приёмки или возврата по правилам.`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}

export async function adminSetOrderStatusAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminSetOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const { orderId, status: next, note } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.status === next) return { ok: true };

  type SetStatusOut = { noop: true } | { noop: false; fromStatus: OrderStatus };

  let setStatusResult!: SetStatusOut;

  try {
    setStatusResult = await prisma.$transaction(
      async (tx): Promise<SetStatusOut> => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord) {
          throw new Error("NOT_FOUND");
        }
        if (ord.status === next) {
          return { noop: true };
        }
        const ou = await tx.order.updateMany({
          where: { id: orderId, status: ord.status },
          data: { status: next },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }
        await appendStatusHistory(tx, {
          orderId,
          fromStatus: ord.status,
          toStatus: next,
          actorUserId: admin.id,
          note: note ?? "Изменение статуса админом",
        });
        return { noop: false, fromStatus: ord.status };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "STATE") {
      return { ok: false, error: "Статус заказа уже изменён, обновите страницу" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  if (setStatusResult.noop) {
    return { ok: true };
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_SET_STATUS",
    entityType: "Order",
    entityId: orderId,
    oldValue: { status: setStatusResult.fromStatus },
    newValue: { status: next, note: note ?? null },
  });

  revalidateOrderPaths(orderId);
  return { ok: true };
}

export async function adminAcceptProposalAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminAcceptProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: { order: true },
  });

  if (!proposal) return { ok: false, error: "Отклик не найден" };
  if (proposal.status !== ProposalStatus.PENDING) {
    return { ok: false, error: "Отклик уже обработан" };
  }

  const orderPre = proposal.order;
  if (orderPre.executorId) {
    return { ok: false, error: "У заказа уже есть специалист" };
  }
  if (
    orderPre.status !== OrderStatus.PUBLISHED ||
    orderPre.visibilityType !== VisibilityType.OPEN_FOR_RESPONSES
  ) {
    return { ok: false, error: "Назначение по отклику недоступно" };
  }
  if (orderPre.paymentStatus !== PaymentStatus.RESERVED) {
    return { ok: false, error: ESCROW_REQUIRED_MSG };
  }

  type AcceptOut = {
    orderId: string;
    customerId: string;
    orderTitle: string;
    executorId: string;
    proposalId: string;
    fromStatus: OrderStatus;
  };

  let acceptOut!: AcceptOut;

  try {
    await prisma.$transaction(
      async (tx) => {
        const prop = await tx.proposal.findUnique({
          where: { id: parsed.data.proposalId },
          include: { order: true },
        });
        if (!prop) {
          throw new Error("NOT_FOUND");
        }
        if (prop.status !== ProposalStatus.PENDING) {
          throw new Error("PROPOSAL_STATE");
        }
        const ord = prop.order;
        if (ord.executorId) {
          throw new Error("ORDER_EXEC");
        }
        if (
          ord.status !== OrderStatus.PUBLISHED ||
          ord.visibilityType !== VisibilityType.OPEN_FOR_RESPONSES
        ) {
          throw new Error("ORDER_BAD");
        }
        if (ord.paymentStatus !== PaymentStatus.RESERVED) {
          throw new Error("NEED_ESCROW");
        }

        const ou = await tx.order.updateMany({
          where: {
            id: ord.id,
            executorId: null,
            status: OrderStatus.PUBLISHED,
            visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: {
            executorId: prop.executorId,
            status: OrderStatus.ASSIGNED,
            assignedByAdmin: true,
            visibilityType: VisibilityType.PLATFORM_ASSIGN,
          },
        });
        if (ou.count !== 1) {
          throw new Error("ORDER_STATE");
        }

        const pu = await tx.proposal.updateMany({
          where: { id: prop.id, status: ProposalStatus.PENDING },
          data: { status: ProposalStatus.ACCEPTED },
        });
        if (pu.count !== 1) {
          throw new Error("PROPOSAL_STATE");
        }

        await tx.proposal.updateMany({
          where: {
            orderId: ord.id,
            id: { not: prop.id },
            status: ProposalStatus.PENDING,
          },
          data: { status: ProposalStatus.REJECTED },
        });

        await tx.assignment.create({
          data: {
            orderId: ord.id,
            executorId: prop.executorId,
            assignedByAdminUserId: admin.id,
          },
        });

        await appendStatusHistory(tx, {
          orderId: ord.id,
          fromStatus: ord.status,
          toStatus: OrderStatus.ASSIGNED,
          actorUserId: admin.id,
          note: "Специалист выбран по отклику",
        });

        const chat = await tx.chat.findUnique({ where: { orderId: ord.id } });
        if (chat) {
          await tx.chatMember.upsert({
            where: { chatId_userId: { chatId: chat.id, userId: prop.executorId } },
            create: { chatId: chat.id, userId: prop.executorId },
            update: {},
          });
        }

        acceptOut = {
          orderId: ord.id,
          customerId: ord.customerId,
          orderTitle: ord.title,
          executorId: prop.executorId,
          proposalId: prop.id,
          fromStatus: ord.status,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 25_000,
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Отклик не найден" };
    if (msg === "PROPOSAL_STATE") {
      return { ok: false, error: "Отклик уже обработан" };
    }
    if (msg === "ORDER_EXEC") {
      return { ok: false, error: "У заказа уже есть специалист" };
    }
    if (msg === "ORDER_BAD" || msg === "ORDER_STATE") {
      return { ok: false, error: "Назначение по отклику недоступно" };
    }
    if (msg === "NEED_ESCROW") {
      return { ok: false, error: ESCROW_REQUIRED_MSG };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_ACCEPT_PROPOSAL",
    entityType: "Order",
    entityId: acceptOut.orderId,
    oldValue: {
      status: acceptOut.fromStatus,
      executorId: null,
      proposalId: acceptOut.proposalId,
    },
    newValue: { status: OrderStatus.ASSIGNED, executorId: acceptOut.executorId },
  });

  revalidateOrderPaths(acceptOut.orderId);

  notifySafe(async () => {
    await createNotification({
      userId: acceptOut.customerId,
      kind: NotificationKind.EXECUTOR_ASSIGNED,
      title: "Выбран специалист",
      body: `По заказу «${acceptOut.orderTitle}»`,
      link: `/orders/${acceptOut.orderId}`,
    });
    await createNotification({
      userId: acceptOut.executorId,
      kind: NotificationKind.EXECUTOR_ASSIGNED,
      title: "Вас назначили на заказ",
      body: acceptOut.orderTitle,
      link: `/orders/${acceptOut.orderId}`,
    });
  });

  return { ok: true };
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/proposals");
  revalidatePath("/customer/orders");
  revalidatePath("/executor/orders");
  revalidatePath("/executor/orders/available");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/audit-logs");
}
