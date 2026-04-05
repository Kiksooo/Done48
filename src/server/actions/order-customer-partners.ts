"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import {
  addOrderCustomerPartnerSchema,
  removeOrderCustomerPartnerSchema,
} from "@/schemas/order-customer-partners";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { assertOrderWritableByCustomer } from "@/server/orders/access";

export async function addOrderCustomerPartnerAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нужна роль заказчика" };
  }

  const parsed = addOrderCustomerPartnerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте email" };
  }

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) {
    return { ok: false, error: "Только основной заказчик может добавлять соучастников" };
  }

  const email = parsed.data.email.toLowerCase();
  const partner = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isActive: true },
  });
  if (!partner?.isActive) {
    return { ok: false, error: "Пользователь с таким email не найден или аккаунт отключён" };
  }
  if (partner.role !== Role.CUSTOMER) {
    return { ok: false, error: "Можно добавить только пользователя с ролью «Заказчик»" };
  }
  if (partner.id === check.order.customerId) {
    return { ok: false, error: "Это уже основной заказчик заказа" };
  }
  if (partner.id === user.id) {
    return { ok: false, error: "Нельзя добавить себя соучастником" };
  }

  try {
    await prisma.orderCustomerPartner.create({
      data: {
        orderId: parsed.data.orderId,
        userId: partner.id,
      },
    });
  } catch {
    return { ok: false, error: "Этот пользователь уже добавлен к заказу" };
  }

  const chat = await prisma.chat.findUnique({ where: { orderId: parsed.data.orderId } });
  if (chat) {
    await prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId: partner.id } },
      create: { chatId: chat.id, userId: partner.id },
      update: {},
    });
  }

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/customer/orders");
  return { ok: true };
}

export async function removeOrderCustomerPartnerAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нужна роль заказчика" };
  }

  const parsed = removeOrderCustomerPartnerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const check = await assertOrderWritableByCustomer(parsed.data.orderId, user.id);
  if (!check.ok) {
    return { ok: false, error: "Только основной заказчик может убирать соучастников" };
  }

  const deleted = await prisma.orderCustomerPartner.deleteMany({
    where: {
      orderId: parsed.data.orderId,
      userId: parsed.data.partnerUserId,
    },
  });
  if (deleted.count === 0) {
    return { ok: false, error: "Соучастник не найден" };
  }

  const chat = await prisma.chat.findUnique({ where: { orderId: parsed.data.orderId } });
  if (chat) {
    await prisma.chatMember.deleteMany({
      where: { chatId: chat.id, userId: parsed.data.partnerUserId },
    });
  }

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/customer/orders");
  return { ok: true };
}
