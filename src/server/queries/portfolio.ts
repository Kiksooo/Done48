import { PortfolioItemModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listPortfolioItemsForExecutor(executorId: string) {
  return prisma.portfolioItem.findMany({
    where: { executorId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listPendingPortfolioItemsForAdmin() {
  return prisma.portfolioItem.findMany({
    where: { moderationStatus: PortfolioItemModerationStatus.PENDING },
    orderBy: { updatedAt: "asc" },
    include: {
      executor: {
        select: {
          id: true,
          email: true,
          executorProfile: { select: { username: true, displayName: true } },
        },
      },
    },
  });
}
