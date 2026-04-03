"use server";

import { Role } from "@prisma/client";
import { getSiteUrl } from "@/lib/site-url";
import { oplatumCreateCheckoutSession } from "@/lib/oplatum-checkout";
import { isOplatumBalanceTopUpConfigured } from "@/lib/oplatum-config";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { demoTopUpSchema } from "@/schemas/finance";
import type { ActionResult } from "@/server/actions/orders/create-order";

export async function customerOplatumStartTopUpAction(
  raw: unknown,
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Только для заказчика" };
  }

  if (!isOplatumBalanceTopUpConfigured()) {
    return { ok: false, error: "Онлайн-оплата не настроена" };
  }

  const parsed = demoTopUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const cents = Math.round(parsed.data.rubles * 100);
  const base = getSiteUrl().replace(/\/$/, "");

  const intent = await prisma.customerTopUpIntent.create({
    data: {
      userId: user.id,
      amountCents: cents,
      currency: "RUB",
    },
  });

  try {
    const session = await oplatumCreateCheckoutSession({
      amountCents: cents,
      successUrl: `${base}/customer/balance?topup=success`,
      cancelUrl: `${base}/customer/balance?topup=cancel`,
      metadata: {
        intentId: intent.id,
        userId: user.id,
        amountCents: String(cents),
      },
    });

    await prisma.customerTopUpIntent.update({
      where: { id: intent.id },
      data: { providerSessionId: session.id },
    });

    return { ok: true, data: { checkoutUrl: session.url } };
  } catch (e) {
    await prisma.customerTopUpIntent.delete({ where: { id: intent.id } }).catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка кассы" };
  }
}
