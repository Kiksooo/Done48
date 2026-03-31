"use server";

import {
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
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import {
  customerAcceptProposalSchema,
  customerOrderActionSchema,
} from "@/schemas/order";
import { assertOrderWritableByCustomer } from "@/server/orders/access";
import { getPlatformFeePercent, splitOrderBudget } from "@/server/finance/split";
import { appendStatusHistory } from "@/server/orders/status";
import { createNotification, notifySafe } from "@/server/notifications/service";
import { writeAuditLog } from "@/server/audit/log";
import type { ActionResult } from "./create-order";

const ESCROW_REQUIRED_MSG =
  "Сначала заблокируйте сумму заказа в безопасной сделке (кнопка выше), затем вы сможете выбрать исполнителя по отклику.";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/customer");
  revalidatePath("/customer/orders");
  revalidatePath("/customer/balance");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/proposals");
  revalidatePath("/executor/orders");
  revalidatePath("/executor/orders/available");
}

export async function customerCancelOrderAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  const allowed: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.ON_MODERATION,
    OrderStatus.PUBLISHED,
  ];
  if (!allowed.includes(check.order.status)) {
    return { ok: false, error: "Отмена недоступна для текущего статуса" };
  }
  if (check.order.executorId) {
    return { ok: false, error: "Нельзя отменить заказ с назначенным исполнителем" };
  }

  const orderId = check.order.id;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord || ord.customerId !== user.id) {
          throw new Error("FORBIDDEN");
        }
        if (ord.executorId) {
          throw new Error("HAS_EXECUTOR");
        }
        if (!allowed.includes(ord.status)) {
          throw new Error("BAD_STATUS");
        }

        if (ord.paymentStatus === PaymentStatus.RESERVED) {
          const ref = await tx.order.updateMany({
            where: {
              id: orderId,
              customerId: user.id,
              executorId: null,
              paymentStatus: PaymentStatus.RESERVED,
              status: { in: allowed },
            },
            data: { paymentStatus: PaymentStatus.REFUNDED },
          });
          if (ref.count === 1) {
            await tx.customerProfile.update({
              where: { userId: user.id },
              data: { balanceCents: { increment: ord.budgetCents } },
            });
            await tx.transaction.create({
              data: {
                type: "REFUND",
                amountCents: ord.budgetCents,
                currency: ord.currency,
                orderId,
                toUserId: user.id,
                meta: { note: "Возврат резерва при отмене заказа" },
              },
            });
          }
        } else if (ord.paymentStatus !== PaymentStatus.UNPAID) {
          throw new Error("PAYMENT_STATE");
        }

        const canceled = await tx.order.updateMany({
          where: {
            id: orderId,
            customerId: user.id,
            executorId: null,
            status: { in: allowed },
          },
          data: { status: OrderStatus.CANCELED },
        });
        if (canceled.count !== 1) {
          throw new Error("STATE");
        }

        await appendStatusHistory(tx, {
          orderId,
          fromStatus: ord.status,
          toStatus: OrderStatus.CANCELED,
          actorUserId: user.id,
          note: "Отмена заказчиком",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа" };
    if (msg === "HAS_EXECUTOR") {
      return { ok: false, error: "Нельзя отменить заказ с назначенным исполнителем" };
    }
    if (msg === "BAD_STATUS") {
      return { ok: false, error: "Отмена недоступна для текущего статуса" };
    }
    if (msg === "PAYMENT_STATE") {
      return { ok: false, error: "Нельзя отменить заказ в текущем платёжном состоянии" };
    }
    if (msg === "STATE") {
      return { ok: false, error: "Заказ уже обновлён, обновите страницу" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);
  return { ok: true };
}

export async function customerAcceptProposalAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerAcceptProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const proposalPre = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: { order: true },
  });
  if (!proposalPre) return { ok: false, error: "Отклик не найден" };
  if (proposalPre.order.customerId !== user.id) {
    return { ok: false, error: "Нет доступа" };
  }
  if (proposalPre.status !== ProposalStatus.PENDING) {
    return { ok: false, error: "Отклик уже обработан" };
  }

  const orderPre = proposalPre.order;
  if (orderPre.executorId) {
    return { ok: false, error: "У заказа уже есть исполнитель" };
  }
  if (
    orderPre.status !== OrderStatus.PUBLISHED ||
    orderPre.visibilityType !== VisibilityType.OPEN_FOR_RESPONSES
  ) {
    return { ok: false, error: "Сейчас нельзя выбрать исполнителя по отклику" };
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
        if (prop.order.customerId !== user.id) {
          throw new Error("FORBIDDEN");
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
            customerId: user.id,
            executorId: null,
            status: OrderStatus.PUBLISHED,
            visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: {
            executorId: prop.executorId,
            status: OrderStatus.ASSIGNED,
            assignedByAdmin: false,
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
            assignedByAdminUserId: null,
          },
        });

        await appendStatusHistory(tx, {
          orderId: ord.id,
          fromStatus: ord.status,
          toStatus: OrderStatus.ASSIGNED,
          actorUserId: user.id,
          note: "Исполнитель выбран заказчиком по отклику",
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
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа" };
    if (msg === "PROPOSAL_STATE") {
      return { ok: false, error: "Отклик уже обработан" };
    }
    if (msg === "ORDER_EXEC") {
      return { ok: false, error: "У заказа уже есть исполнитель" };
    }
    if (msg === "ORDER_BAD" || msg === "ORDER_STATE") {
      return { ok: false, error: "Сейчас нельзя выбрать исполнителя по отклику" };
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
    actorUserId: user.id,
    action: "ORDER_CUSTOMER_ACCEPT_PROPOSAL",
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
      userId: acceptOut.executorId,
      kind: NotificationKind.EXECUTOR_ASSIGNED,
      title: "Вас выбрали исполнителем",
      body: acceptOut.orderTitle,
      link: `/orders/${acceptOut.orderId}`,
    });
  });

  return { ok: true };
}

export async function customerAcceptWorkAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  if (check.order.status !== OrderStatus.SUBMITTED) {
    return { ok: false, error: "Принятие доступно только для сданной работы" };
  }

  if (check.order.paymentStatus !== PaymentStatus.RESERVED) {
    return {
      ok: false,
      error: "Сначала заблокируйте сумму в безопасной сделке (карточка заказа → блокировка с баланса).",
    };
  }

  if (!check.order.executorId) {
    return { ok: false, error: "У заказа нет исполнителя" };
  }

  const orderId = check.order.id;
  const budgetCents = check.order.budgetCents;
  const executorId = check.order.executorId;
  const feePercent = await getPlatformFeePercent();
  const { feeCents, executorCents } = splitOrderBudget(budgetCents, feePercent);

  try {
    await prisma.$transaction(
      async (tx) => {
        const fresh = await tx.order.findUnique({ where: { id: orderId } });
        if (!fresh || fresh.customerId !== user.id) {
          throw new Error("FORBIDDEN");
        }
        if (fresh.status !== OrderStatus.SUBMITTED || fresh.paymentStatus !== PaymentStatus.RESERVED) {
          throw new Error("RESERVE_STATE");
        }
        if (!fresh.executorId || fresh.executorId !== executorId) {
          throw new Error("EXECUTOR");
        }

        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            customerId: user.id,
            executorId,
            status: OrderStatus.SUBMITTED,
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: { status: OrderStatus.ACCEPTED, paymentStatus: PaymentStatus.PAYOUT_PENDING },
        });
        if (ou.count !== 1) {
          throw new Error("RESERVE_STATE");
        }

        await appendStatusHistory(tx, {
          orderId,
          fromStatus: OrderStatus.SUBMITTED,
          toStatus: OrderStatus.ACCEPTED,
          actorUserId: user.id,
          note: "Работа принята заказчиком",
        });

        await tx.executorProfile.update({
          where: { userId: executorId },
          data: { heldCents: { increment: executorCents } },
        });

        await tx.transaction.create({
          data: {
            type: "CAPTURE",
            amountCents: budgetCents,
            currency: fresh.currency,
            orderId,
            fromUserId: user.id,
            toUserId: executorId,
            meta: { executorCents, feeCents, feePercent },
          },
        });

        if (feeCents > 0) {
          await tx.transaction.create({
            data: {
              type: "FEE",
              amountCents: feeCents,
              currency: fresh.currency,
              orderId,
              meta: { note: "Комиссия платформы" },
            },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа" };
    if (msg === "EXECUTOR") {
      return { ok: false, error: "У заказа нет исполнителя" };
    }
    if (msg === "RESERVE_STATE") {
      return {
        ok: false,
        error: "Не удалось провести списание (проверьте резерв и статус)",
      };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);
  revalidatePath("/executor/balance");

  notifySafe(async () => {
    await createNotification({
      userId: executorId,
      kind: NotificationKind.WORK_ACCEPTED,
      title: "Работа принята",
      body: `Заказ: ${check.order.title}`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}

export async function customerRequestRevisionAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  if (check.order.status !== OrderStatus.SUBMITTED) {
    return { ok: false, error: "Доработка доступна только после сдачи" };
  }

  const orderId = check.order.id;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            customerId: user.id,
            status: OrderStatus.SUBMITTED,
          },
          data: { status: OrderStatus.REVISION },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }
        await appendStatusHistory(tx, {
          orderId,
          fromStatus: OrderStatus.SUBMITTED,
          toStatus: OrderStatus.REVISION,
          actorUserId: user.id,
          note: "Запрошена доработка",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "STATE") {
      return { ok: false, error: "Доработка недоступна для текущего статуса" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);

  const ex = check.order.executorId;
  if (ex) {
    notifySafe(async () => {
      await createNotification({
        userId: ex,
        kind: NotificationKind.REVISION_REQUESTED,
        title: "Запрошена доработка",
        body: `Заказ: ${check.order.title}`,
        link: `/orders/${orderId}`,
      });
    });
  }

  return { ok: true };
}
