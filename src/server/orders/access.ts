import type { Order, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export type OrderForAccess = Pick<
  Order,
  "id" | "customerId" | "executorId" | "status" | "visibilityType"
>;

export async function getOrderForAccess(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
  });
}

export function canExecutorSeePublishedOpen(order: OrderForAccess): boolean {
  return (
    order.status === "PUBLISHED" &&
    order.visibilityType === "OPEN_FOR_RESPONSES" &&
    order.executorId === null
  );
}

export async function assertOrderReadable(params: {
  orderId: string;
  userId: string;
  role: Role;
}) {
  const order = await getOrderForAccess(params.orderId);
  if (!order) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (params.role === "ADMIN") {
    return { ok: true as const, order };
  }
  if (order.customerId === params.userId) {
    return { ok: true as const, order };
  }
  if (order.executorId === params.userId) {
    return { ok: true as const, order };
  }
  if (params.role === "EXECUTOR") {
    const proposal = await prisma.proposal.findFirst({
      where: { orderId: order.id, executorId: params.userId },
    });
    if (proposal) {
      return { ok: true as const, order };
    }
    if (canExecutorSeePublishedOpen(order)) {
      return { ok: true as const, order };
    }
  }

  return { ok: false as const, error: "forbidden" as const };
}

export async function assertOrderWritableByCustomer(orderId: string, customerId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customerId) {
    return { ok: false as const, error: "forbidden" as const, order: null };
  }
  return { ok: true as const, order };
}

export async function assertOrderWritableByExecutor(orderId: string, executorId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.executorId !== executorId) {
    return { ok: false as const, error: "forbidden" as const, order: null };
  }
  return { ok: true as const, order };
}
