import { ExecutorAccountStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getPublicExecutorByUsername(usernameRaw: string) {
  const username = usernameRaw.trim().toLowerCase();
  if (!username || username.length > 64) return null;

  return prisma.user.findFirst({
    where: {
      role: Role.EXECUTOR,
      isActive: true,
      executorProfile: {
        username,
        accountStatus: ExecutorAccountStatus.ACTIVE,
      },
    },
    include: {
      executorProfile: true,
      portfolioItems: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

/** Для sitemap: список только активных исполнителей с username (публичные URL /u/[username]). */
export async function listPublicExecutorUsernames() {
  return prisma.user.findMany({
    where: {
      role: Role.EXECUTOR,
      isActive: true,
      executorProfile: {
        accountStatus: ExecutorAccountStatus.ACTIVE,
        username: { not: null },
      },
    },
    select: {
      updatedAt: true,
      executorProfile: {
        select: { username: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Для публичного каталога: карточки исполнителей + мини-превью портфолио. */
export async function listPublicExecutors({ take = 24 }: { take?: number } = {}) {
  return prisma.user.findMany({
    where: {
      role: Role.EXECUTOR,
      isActive: true,
      executorProfile: {
        accountStatus: ExecutorAccountStatus.ACTIVE,
        username: { not: null },
      },
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      updatedAt: true,
      executorProfile: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          city: true,
          bio: true,
        },
      },
      _count: {
        select: {
          portfolioItems: true,
        },
      },
      portfolioItems: {
        take: 2,
        orderBy: { updatedAt: "desc" },
        select: {
          title: true,
          description: true,
          imageUrl: true,
          linkUrl: true,
        },
      },
    },
  });
}
