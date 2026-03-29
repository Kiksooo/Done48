"use server";

import { PaymentStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { demoTopUpSchema, reserveOrderSchema } from "@/schemas/finance";
import { assertOrderWritableByCustomer } from "@/server/orders/access";
import type { ActionResult } from "@/server/actions/orders/create-order";

function revalidateFinance() {
  revalidatePath("/customer/balance");
  revalidatePath("/admin/payments");
}

export async function customerDemoTopUpAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Только для заказчика" };
  }

  const parsed = demoTopUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const cents = Math.round(parsed.data.rubles * 100);

  await prisma.$transaction(async (tx) => {
    await tx.customerProfile.update({
      where: { userId: user.id },
      data: { balanceCents: { increment: cents } },
    });
    await tx.transaction.create({
      data: {
        type: "TOPUP",
        amountCents: cents,
        currency: "RUB",
        toUserId: user.id,
        meta: { source: "demo" },
      },
    });
  });

  revalidateFinance();
  return { ok: true };
}

export async function customerReserveOrderAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Только для заказчика" };
  }

  const parsed = reserveOrderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  const order = check.order;
  if (order.paymentStatus !== PaymentStatus.UNPAID) {
    return { ok: false, error: "Средства уже зарезервированы или оплачены" };
  }

  const blocked = ["CANCELED", "COMPLETED", "DRAFT"];
  if (blocked.includes(order.status)) {
    return { ok: false, error: "Нельзя зарезервировать для этого статуса" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: order.id } });
        if (!ord || ord.paymentStatus !== PaymentStatus.UNPAID) {
          throw new Error("RESERVE_STATE");
        }
        if (["CANCELED", "COMPLETED", "DRAFT"].includes(ord.status)) {
          throw new Error("RESERVE_BLOCKED");
        }

        const dec = await tx.customerProfile.updateMany({
          where: { userId: user.id, balanceCents: { gte: ord.budgetCents } },
          data: { balanceCents: { decrement: ord.budgetCents } },
        });
        if (dec.count === 0) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        await tx.transaction.create({
          data: {
            type: "RESERVE",
            amountCents: ord.budgetCents,
            currency: ord.currency,
            orderId: ord.id,
            fromUserId: user.id,
            meta: { note: "Резерв под заказ" },
          },
        });

        const pay = await tx.order.updateMany({
          where: { id: ord.id, paymentStatus: PaymentStatus.UNPAID },
          data: { paymentStatus: PaymentStatus.RESERVED },
        });
        if (pay.count !== 1) {
          throw new Error("RESERVE_STATE");
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "INSUFFICIENT_FUNDS") {
      return { ok: false, error: "Недостаточно средств на балансе" };
    }
    if (code === "RESERVE_STATE") {
      return { ok: false, error: "Средства уже зарезервированы или оплачены" };
    }
    if (code === "RESERVE_BLOCKED") {
      return { ok: false, error: "Нельзя зарезервировать для этого статуса" };
    }
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034") {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateFinance();
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/customer/orders");
  return { ok: true };
}
