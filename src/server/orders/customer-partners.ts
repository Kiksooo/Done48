import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrderPartnerUserIds(orderId: string): Promise<string[]> {
  const rows = await prisma.orderCustomerPartner.findMany({
    where: { orderId },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

export async function isOrderCustomerPartner(orderId: string, userId: string): Promise<boolean> {
  const r = await prisma.orderCustomerPartner.findUnique({
    where: { orderId_userId: { orderId, userId } },
    select: { id: true },
  });
  return Boolean(r);
}

/** Основной заказчик и все соучастники (уведомления в чате). */
export async function listCustomerSideUserIds(orderId: string): Promise<string[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      customerId: true,
      customerPartners: { select: { userId: true } },
    },
  });
  if (!order) return [];
  return [order.customerId, ...order.customerPartners.map((p) => p.userId)];
}
