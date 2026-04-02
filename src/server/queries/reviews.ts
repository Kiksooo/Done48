import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const reviewFromInclude = {
  fromUser: {
    select: {
      id: true,
      email: true,
      role: true,
      customerProfile: { select: { displayName: true, avatarUrl: true } },
      executorProfile: { select: { displayName: true, username: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.ReviewInclude;

export type ReviewWithFrom = Prisma.ReviewGetPayload<{ include: typeof reviewFromInclude }>;

export async function getReviewStatsForUser(userId: string): Promise<{ avg: number | null; count: number }> {
  const agg = await prisma.review.aggregate({
    where: { toUserId: userId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    avg: agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
    count: agg._count._all,
  };
}

/** Для каталога исполнителей: одна группировка вместо N запросов. */
export async function getReviewStatsForUsers(
  userIds: string[],
): Promise<Map<string, { avg: number | null; count: number }>> {
  const map = new Map<string, { avg: number | null; count: number }>();
  if (userIds.length === 0) return map;

  const rows = await prisma.review.groupBy({
    by: ["toUserId"],
    where: { toUserId: { in: userIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const r of rows) {
    map.set(r.toUserId, {
      avg: r._avg.rating != null ? Math.round(r._avg.rating * 10) / 10 : null,
      count: r._count._all,
    });
  }
  return map;
}

export async function listReviewsReceivedByUser(userId: string, take = 30): Promise<ReviewWithFrom[]> {
  return prisma.review.findMany({
    where: { toUserId: userId },
    include: reviewFromInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listReviewsForOrder(orderId: string): Promise<ReviewWithFrom[]> {
  return prisma.review.findMany({
    where: { orderId },
    include: reviewFromInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function findReviewByOrderAndAuthor(orderId: string, fromUserId: string) {
  return prisma.review.findUnique({
    where: { orderId_fromUserId: { orderId, fromUserId } },
  });
}
