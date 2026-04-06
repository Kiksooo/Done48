"use server";

import { NotificationKind, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { createNotification, notifyActiveAdmins, notifySafe } from "@/server/notifications/service";

function sanitizeMessage(raw: string): string {
  return raw.trim().replace(/\r\n/g, "\n");
}

function cabinetSupportPath(role: Role): string {
  if (role === Role.CUSTOMER) return "/customer/feedback";
  if (role === Role.EXECUTOR) return "/executor/feedback";
  return "/admin/support";
}

export async function sendSupportMessageAction(rawMessage: string): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || (user.role !== Role.CUSTOMER && user.role !== Role.EXECUTOR)) {
    return { ok: false, error: "Доступно только заказчику или специалисту" };
  }

  const message = sanitizeMessage(rawMessage);
  if (message.length < 4) return { ok: false, error: "Сообщение слишком короткое" };
  if (message.length > 3000) return { ok: false, error: "Сообщение слишком длинное" };

  const userRole = user.role as Role;
  const userPath = cabinetSupportPath(userRole);
  const adminBody = `Пользователь: ${user.email}\nРоль: ${user.role}\nСообщение:\n${message}`;

  await createNotification({
    userId: user.id,
    kind: NotificationKind.GENERIC,
    title: "Вы написали в поддержку",
    body: message,
    link: userPath,
  });

  notifySafe(async () => {
    await notifyActiveAdmins({
      kind: NotificationKind.GENERIC,
      title: "Чат поддержки: новое сообщение",
      body: adminBody,
      link: `/admin/support?userId=${encodeURIComponent(user.id)}`,
    });
  });

  revalidatePath(userPath);
  return { ok: true };
}

export async function sendSupportReplyAction(targetUserId: string, rawMessage: string): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) return { ok: false, error: "Только для администратора" };

  const message = sanitizeMessage(rawMessage);
  if (message.length < 2) return { ok: false, error: "Ответ слишком короткий" };
  if (message.length > 3000) return { ok: false, error: "Ответ слишком длинный" };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "Пользователь не найден" };
  if (target.role !== Role.CUSTOMER && target.role !== Role.EXECUTOR) {
    return { ok: false, error: "Можно отвечать только заказчику или специалисту" };
  }

  await createNotification({
    userId: target.id,
    kind: NotificationKind.GENERIC,
    title: "Ответ поддержки",
    body: message,
    link: cabinetSupportPath(target.role),
  });

  revalidatePath(`/admin/support?userId=${encodeURIComponent(target.id)}`);
  return { ok: true };
}
