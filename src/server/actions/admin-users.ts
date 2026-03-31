"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { adminDeleteUserSchema } from "@/schemas/admin-users";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

export async function adminDeleteUserAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminDeleteUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { userId } = parsed.data;

  if (userId === admin.id) {
    return { ok: false, error: "Нельзя удалить собственную учётную запись" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Пользователь не найден" };
  if (target.role === Role.ADMIN) {
    return { ok: false, error: "Удаление учёток администраторов отключено" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { customerId: userId } });
      await tx.dispute.deleteMany({ where: { openedById: userId } });
      await tx.assignment.deleteMany({ where: { executorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch (e) {
    console.error("[admin-users] adminDeleteUserAction failed", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return {
        ok: false,
        error: "Не удалось удалить: остались связанные данные в БД. Попробуйте сначала снять исполнителя с заказов или выполните миграции.",
      };
    }
    return { ok: false, error: "Не удалось удалить пользователя. См. логи сервера." };
  }

  try {
    await writeAuditLog({
      actorUserId: admin.id,
      action: "USER_DELETE",
      entityType: "User",
      entityId: userId,
      oldValue: { email: target.email, role: target.role },
    });
  } catch {
    // аудит не должен блокировать удаление
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}
