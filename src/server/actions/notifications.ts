"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/orders/create-order";

function revalidateCabinetByRole(role: string) {
  if (role === "ADMIN") revalidatePath("/admin", "layout");
  else if (role === "CUSTOMER") revalidatePath("/customer", "layout");
  else if (role === "EXECUTOR") revalidatePath("/executor", "layout");
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user) return { ok: false, error: "Нужна авторизация" };

  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
  });
  if (!n) return { ok: false, error: "Уведомление не найдено" };
  if (n.readAt) return { ok: true };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  revalidateCabinetByRole(user.role);
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user) return { ok: false, error: "Нужна авторизация" };

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateCabinetByRole(user.role);
  return { ok: true };
}
