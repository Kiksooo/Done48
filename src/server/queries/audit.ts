import { prisma } from "@/lib/db";

export async function listAuditLogsForAdmin(take = 200) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { email: true } },
    },
  });
}
