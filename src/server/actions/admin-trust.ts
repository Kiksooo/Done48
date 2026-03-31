"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizeBlocklistValue } from "@/lib/contact-blocklist";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import {
  adminAddBlocklistSchema,
  adminRemoveBlocklistSchema,
  adminSetUserActiveSchema,
  adminUpdateUserReportSchema,
} from "@/schemas/trust";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

export async function adminUpdateUserReportAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminUpdateUserReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  try {
    await prisma.userReport.update({
      where: { id: parsed.data.reportId },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote ?? undefined,
        handledById: admin.id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")) {
      return { ok: false, error: "Раздел модерации недоступен: таблица жалоб ещё не создана в БД." };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "USER_REPORT_UPDATE",
    entityType: "UserReport",
    entityId: parsed.data.reportId,
    newValue: { status: parsed.data.status },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}

export async function adminAddContactBlocklistAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminAddBlocklistSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const valueNorm = normalizeBlocklistValue(parsed.data.kind, parsed.data.value);
  if (!valueNorm) return { ok: false, error: "Пустое значение" };

  try {
    await prisma.contactBlocklist.create({
      data: {
        kind: parsed.data.kind,
        valueNorm,
        reason: parsed.data.reason ?? undefined,
        createdById: admin.id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")) {
      return { ok: false, error: "Блоклист недоступен: таблица ещё не создана в БД." };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Такая запись уже есть в блоклисте" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "BLOCKLIST_ADD",
    entityType: "ContactBlocklist",
    entityId: valueNorm,
    newValue: { kind: parsed.data.kind, valueNorm },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}

export async function adminRemoveContactBlocklistAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminRemoveBlocklistSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  try {
    await prisma.contactBlocklist.delete({ where: { id: parsed.data.entryId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")) {
      return { ok: false, error: "Блоклист недоступен: таблица ещё не создана в БД." };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: "BLOCKLIST_REMOVE",
    entityType: "ContactBlocklist",
    entityId: parsed.data.entryId,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}

export async function adminSetUserActiveAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminSetUserActiveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  if (parsed.data.userId === admin.id && !parsed.data.isActive) {
    return { ok: false, error: "Нельзя отключить самого себя" };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return { ok: false, error: "Пользователь не найден" };
  if (target.role === Role.ADMIN) {
    return { ok: false, error: "Не изменяем учётки администраторов здесь" };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { isActive: parsed.data.isActive },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: "USER_ACTIVE_SET",
    entityType: "User",
    entityId: parsed.data.userId,
    newValue: { isActive: parsed.data.isActive, email: target.email },
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}
