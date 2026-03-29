import { prisma } from "@/lib/db";

export async function listUserReportsForAdmin() {
  return prisma.userReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, email: true } },
      targetUser: { select: { id: true, email: true, isActive: true } },
      order: { select: { id: true, title: true } },
      handledBy: { select: { id: true, email: true } },
    },
    take: 200,
  });
}

export async function listContactBlocklistForAdmin() {
  return prisma.contactBlocklist.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
    take: 500,
  });
}
