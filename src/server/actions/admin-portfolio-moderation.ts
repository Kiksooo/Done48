"use server";

import { PortfolioItemModerationStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { adminApprovePortfolioItemSchema, adminRejectPortfolioItemSchema } from "@/schemas/admin-portfolio";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

async function revalidateAfterPortfolioModeration(executorId: string) {
  revalidatePath("/admin/moderation");
  revalidatePath("/executor/portfolio");
  revalidatePath("/executors");
  revalidatePath("/admin/audit-logs");
  const p = await prisma.executorProfile.findUnique({
    where: { userId: executorId },
    select: { username: true },
  });
  if (p?.username) {
    revalidatePath(`/u/${p.username}`);
  }
}

export async function adminApprovePortfolioItemAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminApprovePortfolioItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const row = await prisma.portfolioItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, executorId: true, title: true, moderationStatus: true },
  });
  if (!row) return { ok: false, error: "Запись не найдена" };
  if (row.moderationStatus !== PortfolioItemModerationStatus.PENDING) {
    return { ok: false, error: "Можно одобрять только работы «На проверке»" };
  }

  await prisma.portfolioItem.update({
    where: { id: row.id },
    data: {
      moderationStatus: PortfolioItemModerationStatus.APPROVED,
      moderationNote: null,
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: "PORTFOLIO_MODERATE_APPROVE",
    entityType: "PortfolioItem",
    entityId: row.id,
    newValue: { title: row.title, executorId: row.executorId },
  });

  await revalidateAfterPortfolioModeration(row.executorId);
  return { ok: true };
}

export async function adminRejectPortfolioItemAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminRejectPortfolioItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const row = await prisma.portfolioItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, executorId: true, title: true, moderationStatus: true },
  });
  if (!row) return { ok: false, error: "Запись не найдена" };
  if (row.moderationStatus !== PortfolioItemModerationStatus.PENDING) {
    return { ok: false, error: "Можно отклонять только работы «На проверке»" };
  }

  await prisma.portfolioItem.update({
    where: { id: row.id },
    data: {
      moderationStatus: PortfolioItemModerationStatus.REJECTED,
      moderationNote: parsed.data.note,
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: "PORTFOLIO_MODERATE_REJECT",
    entityType: "PortfolioItem",
    entityId: row.id,
    newValue: { title: row.title, executorId: row.executorId, note: parsed.data.note },
  });

  await revalidateAfterPortfolioModeration(row.executorId);
  return { ok: true };
}
