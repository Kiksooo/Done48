import { prisma } from "@/lib/db";

export async function listPortfolioItemsForExecutor(executorId: string) {
  return prisma.portfolioItem.findMany({
    where: { executorId },
    orderBy: { updatedAt: "desc" },
  });
}
