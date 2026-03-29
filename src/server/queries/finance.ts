import { prisma } from "@/lib/db";

export async function listTransactionsForUser(userId: string, limit = 100) {
  return prisma.transaction.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: {
      order: { select: { id: true, publicId: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAllTransactions(limit = 200) {
  return prisma.transaction.findMany({
    include: {
      fromUser: { select: { id: true, email: true } },
      toUser: { select: { id: true, email: true } },
      order: { select: { id: true, publicId: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listPayouts(status?: "PENDING" | "APPROVED" | "REJECTED" | "PAID") {
  return prisma.payout.findMany({
    where: status ? { status } : undefined,
    include: {
      executor: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
