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
