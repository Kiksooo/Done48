import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listExecutorProfilesForAdmin() {
  return prisma.executorProfile.findMany({
    where: { user: { role: Role.EXECUTOR } },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, email: true, isActive: true, createdAt: true } },
    },
  });
}
