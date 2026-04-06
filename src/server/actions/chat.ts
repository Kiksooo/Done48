"use server";

import { NotificationKind, type Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { isTrustedChatUploadUrl } from "@/lib/uploads/object-storage";
import { sendChatMessageSchema } from "@/schemas/chat";
import { assertOrderReadable } from "@/server/orders/access";
import { canPostOrderChat, listCustomerSideUserIds } from "@/server/orders/customer-partners";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { createNotificationsForUsers, notifySafe } from "@/server/notifications/service";

export async function sendChatMessageAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user) return { ok: false, error: "Нужна авторизация" };

  const parsed = sendChatMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  let attachmentUrl: string | undefined;
  const rawUrl = parsed.data.attachmentUrl?.trim();
  if (rawUrl) {
    if (isTrustedChatUploadUrl(parsed.data.orderId, rawUrl)) {
      attachmentUrl = rawUrl;
    } else {
      try {
        const u = new URL(rawUrl);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          return { ok: false, error: "Разрешены только загруженные вложения или http(s) ссылки" };
        }
        attachmentUrl = rawUrl;
      } catch {
        return { ok: false, error: "Некорректная ссылка на вложение" };
      }
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, customerId: true, executorId: true, title: true },
  });
  if (!order) return { ok: false, error: "Заказ не найден" };

  const access = await assertOrderReadable({
    orderId: order.id,
    userId: user.id,
    role: user.role as Role,
  });
  if (!access.ok) return { ok: false, error: "Нет доступа к чату" };

  if (!(await canPostOrderChat(user.id, user.role as Role, order))) {
    return { ok: false, error: "Отправка сообщений доступна заказчику, специалисту и админу" };
  }

  const chat = await prisma.chat.findUnique({ where: { orderId: order.id } });
  if (!chat) return { ok: false, error: "Чат не найден" };

  await prisma.chatMember.upsert({
    where: { chatId_userId: { chatId: chat.id, userId: user.id } },
    create: { chatId: chat.id, userId: user.id },
    update: {},
  });

  await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderId: user.id,
      kind: "USER",
      body: parsed.data.body,
      attachmentUrl,
    },
  });

  const preview = parsed.data.body.trim().slice(0, 200);
  const customerSide = await listCustomerSideUserIds(order.id);
  const targets = new Set<string>();
  for (const uid of customerSide) {
    if (uid !== user.id) targets.add(uid);
  }
  if (order.executorId && order.executorId !== user.id) targets.add(order.executorId);
  notifySafe(async () => {
    if (targets.size === 0) return;
    await createNotificationsForUsers(Array.from(targets), {
      kind: NotificationKind.NEW_MESSAGE,
      title: `Чат: ${order.title}`,
      body: preview || null,
      link: `/orders/${order.id}`,
    });
  });

  await prisma.chatMember.updateMany({
    where: { chatId: chat.id, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/customer", "layout");
  revalidatePath("/executor", "layout");
  return { ok: true };
}

export async function markChatReadAction(orderId: string): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user) return { ok: false, error: "Нужна авторизация" };

  const chat = await prisma.chat.findUnique({ where: { orderId } });
  if (!chat) return { ok: false, error: "Чат не найден" };

  const access = await assertOrderReadable({
    orderId,
    userId: user.id,
    role: user.role as Role,
  });
  if (!access.ok) return { ok: false, error: "Нет доступа" };

  await prisma.chatMember.updateMany({
    where: { chatId: chat.id, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/customer", "layout");
  revalidatePath("/executor", "layout");
  return { ok: true };
}
