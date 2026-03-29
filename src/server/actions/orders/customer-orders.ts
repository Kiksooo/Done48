"use server";

import {
  NotificationKind,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { customerOrderActionSchema } from "@/schemas/order";
import { assertOrderWritableByCustomer } from "@/server/orders/access";
import { getPlatformFeePercent, splitOrderBudget } from "@/server/finance/split";
import { appendStatusHistory } from "@/server/orders/status";
import { createNotification, notifySafe } from "@/server/notifications/service";
import type { ActionResult } from "./create-order";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/customer");
  revalidatePath("/customer/orders");
  revalidatePath("/customer/balance");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
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
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034") {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);
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
      error: "Сначала зарезервируйте средства под заказ (баланс → резерв)",
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
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034") {
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
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034") {
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
