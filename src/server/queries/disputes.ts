import { DisputeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const activeStatuses: DisputeStatus[] = [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW];

export async function listDisputesForAdmin() {
  return prisma.dispute.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      order: { select: { id: true, title: true, status: true } },
      openedBy: { select: { id: true, email: true } },
    },
  });
}

export async function getDisputeOpenFlagsForOrder(orderId: string, orderStatus: string) {
  const active = await prisma.dispute.findFirst({
    where: { orderId, status: { in: activeStatuses } },
    select: { id: true },
  });

  const allowed = ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVISION", "ACCEPTED"];
  const canOpenDispute = allowed.includes(orderStatus) && !active;

  return {
    hasActiveDispute: Boolean(active),
    canOpenDispute,
  };
}
