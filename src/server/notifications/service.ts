import type { NotificationKind } from "@prisma/client";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type CreateNotificationInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  link?: string | null;
};

async function revalidateLayoutsForUserIds(userIds: string[]) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return;
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { role: true },
  });
  const roles = new Set(users.map((u) => u.role));
  if (roles.has(Role.CUSTOMER)) revalidatePath("/customer", "layout");
  if (roles.has(Role.EXECUTOR)) revalidatePath("/executor", "layout");
  if (roles.has(Role.ADMIN)) revalidatePath("/admin", "layout");
}

export async function createNotification(input: CreateNotificationInput) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? undefined,
      link: input.link ?? undefined,
    },
  });
  await revalidateLayoutsForUserIds([input.userId]);
}

export async function createNotificationsForUsers(
  userIds: string[],
  payload: Omit<CreateNotificationInput, "userId">,
) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      kind: payload.kind,
      title: payload.title,
      body: payload.body ?? undefined,
      link: payload.link ?? undefined,
    })),
  });
  await revalidateLayoutsForUserIds(unique);
}

export async function notifyActiveAdmins(payload: Omit<CreateNotificationInput, "userId">) {
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, isActive: true },
    select: { id: true },
  });
  await createNotificationsForUsers(
    admins.map((a) => a.id),
    payload,
  );
}

/** Не ломает основной сценарий при сбое записи уведомления. */
export function notifySafe(fn: () => Promise<void>) {
  void fn().catch((e) => {
    // eslint-disable-next-line no-console
    console.error("[notifications]", e);
  });
}
