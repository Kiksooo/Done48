import { prisma } from "@/lib/db";

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      onboardingDone: true,
      createdAt: true,
    },
  });
}
