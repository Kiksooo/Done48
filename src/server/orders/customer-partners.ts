import type { Role } from "@prisma/client";
import { isPrismaTableDoesNotExist } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";

export async function getOrderPartnerUserIds(orderId: string): Promise<string[]> {
  try {
    const rows = await prisma.orderCustomerPartner.findMany({
      where: { orderId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  } catch (e) {
    if (isPrismaTableDoesNotExist(e)) return [];
    throw e;
  }
}

export async function isOrderCustomerPartner(orderId: string, userId: string): Promise<boolean> {
  try {
    const r = await prisma.orderCustomerPartner.findUnique({
      where: { orderId_userId: { orderId, userId } },
      select: { id: true },
    });
    return Boolean(r);
  } catch (e) {
    if (isPrismaTableDoesNotExist(e)) return false;
    throw e;
  }
}

/** Основной заказчик и все соучастники (уведомления в чате). */
export async function listCustomerSideUserIds(orderId: string): Promise<string[]> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        customerId: true,
        customerPartners: { select: { userId: true } },
      },
    });
    if (!order) return [];
    return [order.customerId, ...order.customerPartners.map((p) => p.userId)];
  } catch (e) {
    if (!isPrismaTableDoesNotExist(e)) throw e;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });
    if (!order) return [];
    return [order.customerId];
  }
}

export async function canPostOrderChat(
  userId: string,
  role: Role,
  order: { id: string; customerId: string; executorId: string | null },
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (userId === order.customerId) return true;
  if (order.executorId && userId === order.executorId) return true;
  if (role === "CUSTOMER" && (await isOrderCustomerPartner(order.id, userId))) return true;
  return false;
}
