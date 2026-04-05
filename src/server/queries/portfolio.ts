import { PortfolioItemModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listPortfolioItemsForExecutor(executorId: string) {
  return prisma.portfolioItem.findMany({
    where: { executorId },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Очередь модерации галереи. При несовпадении схемы БД (миграция не применена) не бросаем —
 * иначе падает вся страница /admin/moderation.
 */
export async function listPendingPortfolioItemsForAdmin(): Promise<{
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    updatedAt: Date;
    executor: {
      id: string;
      email: string;
      executorProfile: { username: string | null; displayName: string | null } | null;
    };
  }>;
  loadError: string | null;
}> {
  try {
    const items = await prisma.portfolioItem.findMany({
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
    return { items, loadError: null };
  } catch (e) {
    console.error("[portfolio] listPendingPortfolioItemsForAdmin failed", e);
    return {
      items: [],
      loadError:
        "Не удалось загрузить очередь галереи. Убедитесь, что в БД применена миграция prisma/migrations/20260403210000_portfolio_item_moderation (npx prisma migrate deploy).",
    };
  }
}
