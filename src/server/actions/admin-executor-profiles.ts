"use server";

import { ExecutorAccountStatus, NotificationKind, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { adminSetExecutorAccountStatusSchema } from "@/schemas/admin-executor-profiles";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

export async function adminSetExecutorAccountStatusAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminSetExecutorAccountStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { userId, status } = parsed.data;

  const row = await prisma.executorProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, role: true } } },
  });

  if (!row || row.user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Профиль исполнителя не найден" };
  }

  const beforeStatus = row.accountStatus;

  try {
    await prisma.executorProfile.update({
      where: { userId },
      data: { accountStatus: status },
    });
  } catch (e) {
    console.error("[admin-executor-profiles] update accountStatus failed", e);
    return { ok: false, error: "Не удалось обновить статус. Проверьте БД." };
  }

  if (status === ExecutorAccountStatus.ACTIVE && beforeStatus !== ExecutorAccountStatus.ACTIVE) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          kind: NotificationKind.GENERIC,
          title: "Анкета одобрена",
          body: "Статус аккаунта «Активен». Можно откликаться на заказы.",
          link: "/executor/orders/available",
        },
      });
    } catch {
      // уведомление не блокирует сохранение
    }
  } else if (
    status === ExecutorAccountStatus.BLOCKED &&
    beforeStatus !== ExecutorAccountStatus.BLOCKED
  ) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          kind: NotificationKind.GENERIC,
          title: "Аккаунт исполнителя заблокирован",
          body: "Обратитесь в поддержку площадки, если нужны детали.",
          link: "/executor/profile",
        },
      });
    } catch {
      // ignore
    }
  }

  try {
    await writeAuditLog({
      actorUserId: admin.id,
      action: "EXECUTOR_ACCOUNT_STATUS_SET",
      entityType: "ExecutorProfile",
      entityId: userId,
      oldValue: { accountStatus: beforeStatus, email: row.user.email },
      newValue: { accountStatus: status },
    });
  } catch {
    // аудит не блокирует
  }

  revalidatePath("/admin/executors");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/executor/profile");
  revalidatePath("/executor/orders/available");
  return { ok: true };
}
