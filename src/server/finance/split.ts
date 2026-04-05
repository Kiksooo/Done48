import { prisma } from "@/lib/db";

export async function getPlatformFeePercent(): Promise<number> {
  const s = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const n = s ? Number(s.platformFeePercent) : 10;
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 10;
}

export { splitOrderBudget } from "@/lib/order-budget-math";
