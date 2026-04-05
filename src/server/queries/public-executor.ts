import type { Prisma } from "@prisma/client";
import {
  ExecutorAccountStatus,
  PortfolioItemModerationStatus,
  Role,
  UserReportStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type PublicExecutorListFilters = {
  q?: string;
  city?: string;
};

/** Жалобы в работе — убираем из каталога, sitemap и публичного профиля до решения модерации. */
function whereNoOpenTrustReports(): Prisma.UserWhereInput {
  return {
    NOT: {
      reportsAgainst: {
        some: {
          status: { in: [UserReportStatus.OPEN, UserReportStatus.IN_REVIEW] },
        },
      },
    },
  };
}

const executorProfileCatalogBase: Prisma.ExecutorProfileWhereInput = {
  accountStatus: ExecutorAccountStatus.ACTIVE,
  username: { not: null },
};

function buildPublicExecutorWhere(filters: PublicExecutorListFilters = {}): Prisma.UserWhereInput {
  const q = filters.q?.trim();
  const city = filters.city?.trim();

  const profileIs: Prisma.ExecutorProfileWhereInput = {
    ...executorProfileCatalogBase,
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
  };

  const parts: Prisma.UserWhereInput[] = [
    { role: Role.EXECUTOR, isActive: true },
    whereNoOpenTrustReports(),
    { executorProfile: { is: profileIs } },
  ];

  if (q) {
    parts.push({
      OR: [
        { executorProfile: { is: { displayName: { contains: q, mode: "insensitive" } } } },
        { executorProfile: { is: { username: { contains: q, mode: "insensitive" } } } },
        { executorProfile: { is: { bio: { contains: q, mode: "insensitive" } } } },
        { executorProfile: { is: { city: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  return { AND: parts };
}

export async function getPublicExecutorByUsername(usernameRaw: string) {
  const username = usernameRaw.trim().toLowerCase();
  if (!username || username.length > 64) return null;

  return prisma.user.findFirst({
    where: {
      AND: [
        { role: Role.EXECUTOR, isActive: true },
        whereNoOpenTrustReports(),
        {
          executorProfile: {
            is: {
              username,
              accountStatus: ExecutorAccountStatus.ACTIVE,
            },
          },
        },
      ],
    },
    include: {
      executorProfile: true,
      portfolioItems: {
        where: { moderationStatus: PortfolioItemModerationStatus.APPROVED },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

/** Для sitemap: активные исполнители с username, без открытых жалоб в модерации. */
export async function listPublicExecutorUsernames() {
  return prisma.user.findMany({
    where: buildPublicExecutorWhere(),
    select: {
      updatedAt: true,
      executorProfile: {
        select: { username: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Справочник городов для фильтра каталога. */
export async function listPublicExecutorCities() {
  const rows = await prisma.executorProfile.groupBy({
    by: ["city"],
    where: {
      ...executorProfileCatalogBase,
      city: { not: null },
      user: {
        role: Role.EXECUTOR,
        isActive: true,
        ...whereNoOpenTrustReports(),
      },
    },
    orderBy: { city: "asc" },
  });

  return rows.map((r) => r.city).filter((c): c is string => c != null && c.length > 0);
}

export async function countPublicExecutors(filters: PublicExecutorListFilters = {}) {
  return prisma.user.count({ where: buildPublicExecutorWhere(filters) });
}

export async function listPublicExecutors({
  take = 24,
  skip = 0,
  ...filters
}: PublicExecutorListFilters & { take?: number; skip?: number } = {}) {
  return prisma.user.findMany({
    where: buildPublicExecutorWhere(filters),
    orderBy: { updatedAt: "desc" },
    skip,
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
          portfolioItems: {
            where: { moderationStatus: PortfolioItemModerationStatus.APPROVED },
          },
        },
      },
      portfolioItems: {
        where: { moderationStatus: PortfolioItemModerationStatus.APPROVED },
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
