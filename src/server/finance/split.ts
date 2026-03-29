import { prisma } from "@/lib/db";

export async function getPlatformFeePercent(): Promise<number> {
  const s = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const n = s ? Number(s.platformFeePercent) : 10;
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 10;
}

/** Комиссия платформы и сумма исполнителю из бюджета заказа (копейки). */
export function splitOrderBudget(budgetCents: number, feePercent: number) {
  const feeCents = Math.min(budgetCents, Math.round((budgetCents * feePercent) / 100));
  const executorCents = budgetCents - feeCents;
  return { feeCents, executorCents };
}
