import { prisma } from "@/lib/db";

const listTake = 100;

export async function listNotificationsForUser(userId: string) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: listTake,
    });
  } catch {
    return [];
  }
}

export async function countUnreadNotifications(userId: string) {
  try {
    return await prisma.notification.count({
      where: { userId, readAt: null },
    });
  } catch {
    return 0;
  }
}
