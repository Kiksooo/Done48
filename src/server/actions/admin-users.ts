"use server";

import {
  ContactBlocklistKind,
  ExecutorAccountStatus,
  OrderStatus,
  Prisma,
  ProposalStatus,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { normalizeBlocklistValue } from "@/lib/contact-blocklist";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { adminDeleteUserSchema, adminSetUserRoleSchema } from "@/schemas/admin-users";
import type { ActionResult } from "@/server/actions/orders/create-order";

const TERMINAL_ORDER_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELED];

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

  const deletedEmailNorm = normalizeBlocklistValue("EMAIL", target.email);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { customerId: userId } });
      await tx.dispute.deleteMany({ where: { openedById: userId } });
      await tx.assignment.deleteMany({ where: { executorId: userId } });
      await tx.user.delete({ where: { id: userId } });
      // Чтобы тот же email можно было зарегистрировать снова (регистрация проверяет блок-лист).
      await tx.contactBlocklist.deleteMany({
        where: { kind: ContactBlocklistKind.EMAIL, valueNorm: deletedEmailNorm },
      });
    });
  } catch (e) {
    console.error("[admin-users] adminDeleteUserAction failed", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return {
        ok: false,
        error: "Не удалось удалить: остались связанные данные в БД. Попробуйте сначала снять специалиста с заказов или выполните миграции.",
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

export async function adminSetUserRoleAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminSetUserRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { userId, role: newRole } = parsed.data;

  if (userId === admin.id) {
    return { ok: false, error: "Нельзя изменить роль собственной учётной записи" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      customerProfile: { select: { displayName: true } },
      executorProfile: { select: { displayName: true } },
    },
  });
  if (!target) return { ok: false, error: "Пользователь не найден" };
  if (target.role === Role.ADMIN) {
    return { ok: false, error: "Роль администратора нельзя менять этим способом" };
  }
  if (target.role === newRole) {
    return { ok: true };
  }

  if (newRole === Role.EXECUTOR && target.role === Role.CUSTOMER) {
    const activeAsCustomer = await prisma.order.count({
      where: { customerId: userId, status: { notIn: TERMINAL_ORDER_STATUSES } },
    });
    if (activeAsCustomer > 0) {
      return {
        ok: false,
        error:
          "Нельзя сменить роль: у пользователя есть незавершённые заказы как заказчик (не «Завершён» и не «Отменён»).",
      };
    }
  }

  if (newRole === Role.CUSTOMER && target.role === Role.EXECUTOR) {
    const activeAsExecutor = await prisma.order.count({
      where: { executorId: userId, status: { notIn: TERMINAL_ORDER_STATUSES } },
    });
    if (activeAsExecutor > 0) {
      return {
        ok: false,
        error:
          "Нельзя сменить роль: у пользователя есть незавершённые заказы как специалист (не «Завершён» и не «Отменён»).",
      };
    }
    const pendingProposals = await prisma.proposal.count({
      where: { executorId: userId, status: ProposalStatus.PENDING },
    });
    if (pendingProposals > 0) {
      return {
        ok: false,
        error: "Нельзя сменить роль: у пользователя есть активные отклики в ожидании (PENDING).",
      };
    }
  }

  const displaySeed =
    target.executorProfile?.displayName?.trim() ||
    target.customerProfile?.displayName?.trim() ||
    target.email.split("@")[0] ||
    "Пользователь";

  const prevRole = target.role;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      if (newRole === Role.EXECUTOR) {
        await tx.executorProfile.upsert({
          where: { userId },
          update: { accountStatus: ExecutorAccountStatus.ACTIVE },
          create: {
            userId,
            displayName: displaySeed,
            accountStatus: ExecutorAccountStatus.ACTIVE,
          },
        });
      } else {
        await tx.customerProfile.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            displayName: displaySeed,
          },
        });
      }
    });
  } catch (e) {
    console.error("[admin-users] adminSetUserRoleAction failed", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "Не удалось сохранить роль. Проверьте данные и попробуйте снова." };
    }
    return { ok: false, error: "Не удалось сменить роль." };
  }

  try {
    await writeAuditLog({
      actorUserId: admin.id,
      action: "USER_ROLE_SET",
      entityType: "User",
      entityId: userId,
      oldValue: { role: prevRole, email: target.email },
      newValue: { role: newRole },
    });
  } catch {
    /* аудит не должен блокировать */
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/executors");
  return { ok: true };
}
