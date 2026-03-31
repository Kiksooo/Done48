import { prisma } from "@/lib/db";

export async function listUserReportsForAdmin() {
  try {
    return await prisma.userReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, email: true } },
        targetUser: { select: { id: true, email: true, isActive: true } },
        order: { select: { id: true, title: true } },
        handledBy: { select: { id: true, email: true } },
      },
      take: 200,
    });
  } catch {
    return [];
  }
}

export async function listContactBlocklistForAdmin() {
  try {
    return await prisma.contactBlocklist.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { email: true } } },
      take: 500,
    });
  } catch {
    return [];
  }
}
