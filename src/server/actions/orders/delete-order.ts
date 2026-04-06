"use server";

import { NotificationKind, OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import { customerOrderActionSchema } from "@/schemas/order";
import { writeAuditLog } from "@/server/audit/log";
import { createNotification, notifySafe } from "@/server/notifications/service";
import type { ActionResult } from "./create-order";

function revalidateOrderDeletePaths(orderId: string) {
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

function assertDeletablePayment(ps: PaymentStatus): string | null {
  if (ps === PaymentStatus.PAYOUT_PENDING || ps === PaymentStatus.PAYOUT_DONE) {
    return "Удаление недоступно: по заказу уже есть выплаты или удержание у специалиста.";
  }
  return null;
}

const CUSTOMER_DELETE_STATUSES: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.NEW,
  OrderStatus.ON_MODERATION,
  OrderStatus.PUBLISHED,
  OrderStatus.CANCELED,
];

const ADMIN_DELETE_STATUSES: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.NEW,
  OrderStatus.ON_MODERATION,
  OrderStatus.PUBLISHED,
  OrderStatus.ASSIGNED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.SUBMITTED,
  OrderStatus.REVISION,
  OrderStatus.CANCELED,
  OrderStatus.DISPUTED,
];

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

/**
 * Заказчик: только без специалиста, до активной работы / после отмены.
 * При RESERVED — возврат на баланс, затем удаление строки заказа.
 */
export async function customerDeleteOrderAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const orderId = parsed.data.orderId;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.customerId !== user.id) {
    return { ok: false, error: "Нет доступа" };
  }

  const payErr = assertDeletablePayment(order.paymentStatus);
  if (payErr) return { ok: false, error: payErr };

  if (order.executorId) {
    return {
      ok: false,
      error:
        "Нельзя удалить заказ с назначенным специалистом. Сначала снимите специалиста в карточке заказа.",
    };
  }

  if (!CUSTOMER_DELETE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      error: "Удаление доступно только для заказа без активной работы или после отмены.",
    };
  }

  if (
    order.paymentStatus !== PaymentStatus.UNPAID &&
    order.paymentStatus !== PaymentStatus.RESERVED &&
    order.paymentStatus !== PaymentStatus.REFUNDED
  ) {
    return { ok: false, error: "Удаление недоступно в текущем платёжном статусе" };
  }

  const snapshot = {
    status: order.status,
    paymentStatus: order.paymentStatus,
    title: order.title,
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord || ord.customerId !== user.id) {
          throw new Error("FORBIDDEN");
        }
        if (ord.executorId) {
          throw new Error("EXECUTOR");
        }
        if (!CUSTOMER_DELETE_STATUSES.includes(ord.status)) {
          throw new Error("STATUS");
        }
        if (
          ord.paymentStatus !== PaymentStatus.UNPAID &&
          ord.paymentStatus !== PaymentStatus.RESERVED &&
          ord.paymentStatus !== PaymentStatus.REFUNDED
        ) {
          throw new Error("PAYMENT");
        }

        if (ord.paymentStatus === PaymentStatus.RESERVED) {
          await tx.customerProfile.update({
            where: { userId: user.id },
            data: { balanceCents: { increment: ord.budgetCents } },
          });
          await tx.transaction.create({
            data: {
              type: "REFUND",
              amountCents: ord.budgetCents,
              currency: ord.currency,
              orderId: ord.id,
              toUserId: user.id,
              meta: { note: "Возврат резерва при удалении заказа" },
            },
          });
        }

        const del = await tx.order.deleteMany({
          where: {
            id: orderId,
            customerId: user.id,
            executorId: null,
            status: { in: CUSTOMER_DELETE_STATUSES },
            paymentStatus: ord.paymentStatus,
          },
        });
        if (del.count !== 1) {
          throw new Error("STATE");
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа" };
    if (msg === "EXECUTOR") {
      return {
        ok: false,
        error: "Нельзя удалить заказ с назначенным специалистом. Сначала снимите специалиста.",
      };
    }
    if (msg === "STATUS" || msg === "PAYMENT" || msg === "STATE") {
      return { ok: false, error: "Удаление сейчас невозможно. Обновите страницу и попробуйте снова." };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "ORDER_DELETE_CUSTOMER",
    entityType: "Order",
    entityId: orderId,
    oldValue: { status: snapshot.status, paymentStatus: snapshot.paymentStatus, title: snapshot.title },
  });

  revalidateOrderDeletePaths(orderId);
  return { ok: true };
}

/**
 * Администратор: удаление с возвратом резерва заказчику; без выплат специалисту (PAYOUT_*).
 */
export async function adminDeleteOrderAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const orderId = parsed.data.orderId;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Заказ не найден" };

  const payErr = assertDeletablePayment(order.paymentStatus);
  if (payErr) return { ok: false, error: payErr };

  if (order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.COMPLETED) {
    return {
      ok: false,
      error: "Нельзя удалить принятый или завершённый заказ (есть финансовые проводки).",
    };
  }

  if (!ADMIN_DELETE_STATUSES.includes(order.status)) {
    return { ok: false, error: "Удаление недоступно для текущего статуса заказа." };
  }

  if (
    order.paymentStatus !== PaymentStatus.UNPAID &&
    order.paymentStatus !== PaymentStatus.RESERVED &&
    order.paymentStatus !== PaymentStatus.REFUNDED
  ) {
    return { ok: false, error: "Удаление недоступно в текущем платёжном статусе" };
  }

  const customerId = order.customerId;
  const executorId = order.executorId;
  const title = order.title;
  const pay = order.paymentStatus;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord) {
          throw new Error("NOT_FOUND");
        }
        if (ord.status === OrderStatus.ACCEPTED || ord.status === OrderStatus.COMPLETED) {
          throw new Error("TERMINAL");
        }
        if (!ADMIN_DELETE_STATUSES.includes(ord.status)) {
          throw new Error("STATUS");
        }
        if (
          ord.paymentStatus !== PaymentStatus.UNPAID &&
          ord.paymentStatus !== PaymentStatus.RESERVED &&
          ord.paymentStatus !== PaymentStatus.REFUNDED
        ) {
          throw new Error("PAYMENT");
        }

        if (ord.paymentStatus === PaymentStatus.RESERVED) {
          await tx.customerProfile.update({
            where: { userId: ord.customerId },
            data: { balanceCents: { increment: ord.budgetCents } },
          });
          await tx.transaction.create({
            data: {
              type: "REFUND",
              amountCents: ord.budgetCents,
              currency: ord.currency,
              orderId: ord.id,
              toUserId: ord.customerId,
              meta: { note: "Возврат резерва при удалении заказа администратором" },
            },
          });
        }

        const del = await tx.order.deleteMany({
          where: {
            id: orderId,
            status: { in: ADMIN_DELETE_STATUSES },
            paymentStatus: ord.paymentStatus,
          },
        });
        if (del.count !== 1) {
          throw new Error("STATE");
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "TERMINAL" || msg === "STATUS" || msg === "PAYMENT" || msg === "STATE") {
      return { ok: false, error: "Удаление сейчас невозможно. Обновите страницу и попробуйте снова." };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "ORDER_DELETE_ADMIN",
    entityType: "Order",
    entityId: orderId,
    oldValue: {
      status: order.status,
      paymentStatus: pay,
      title,
      customerId,
      executorId,
    },
  });

  revalidateOrderDeletePaths(orderId);

  notifySafe(async () => {
    await createNotification({
      userId: customerId,
      kind: NotificationKind.GENERIC,
      title: "Заказ удалён",
      body: `Администратор удалил заказ «${title}».`,
      link: "/customer/orders",
    });
    if (executorId) {
      await createNotification({
        userId: executorId,
        kind: NotificationKind.GENERIC,
        title: "Заказ удалён",
        body: `Заказ «${title}» удалён администратором.`,
        link: "/executor/orders",
      });
    }
  });

  return { ok: true };
}
