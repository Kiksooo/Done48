"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { portfolioCreateSchema, portfolioDeleteSchema, portfolioUpdateSchema } from "@/schemas/portfolio";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireExecutor() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.EXECUTOR) return null;
  return u;
}

async function revalidatePortfolioPages(executorId: string) {
  revalidatePath("/executor/portfolio");
  revalidatePath("/admin/audit-logs");
  const p = await prisma.executorProfile.findUnique({
    where: { userId: executorId },
    select: { username: true },
  });
  if (p?.username) {
    revalidatePath(`/u/${p.username}`);
  }
  revalidatePath("/executors");
}

export async function createPortfolioItemAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireExecutor();
  if (!user) return { ok: false, error: "Нет доступа" };

  const parsed = portfolioCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const d = parsed.data;
  const item = await prisma.portfolioItem.create({
    data: {
      executorId: user.id,
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "PORTFOLIO_CREATE",
    entityType: "PortfolioItem",
    entityId: item.id,
    newValue: { title: item.title },
  });

  await revalidatePortfolioPages(user.id);
  return { ok: true, data: { id: item.id } };
}

export async function updatePortfolioItemAction(raw: unknown): Promise<ActionResult> {
  const user = await requireExecutor();
  if (!user) return { ok: false, error: "Нет доступа" };

  const parsed = portfolioUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: parsed.data.id, executorId: user.id },
  });
  if (!existing) return { ok: false, error: "Запись не найдена" };

  const d = parsed.data;
  const before = {
    title: existing.title,
    description: existing.description,
    imageUrl: existing.imageUrl,
    linkUrl: existing.linkUrl,
  };

  await prisma.portfolioItem.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "PORTFOLIO_UPDATE",
    entityType: "PortfolioItem",
    entityId: d.id,
    oldValue: before,
    newValue: {
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl,
    },
  });

  await revalidatePortfolioPages(user.id);
  return { ok: true };
}

export async function deletePortfolioItemAction(raw: unknown): Promise<ActionResult> {
  const user = await requireExecutor();
  if (!user) return { ok: false, error: "Нет доступа" };

  const parsed = portfolioDeleteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: parsed.data.id, executorId: user.id },
  });
  if (!existing) return { ok: false, error: "Запись не найдена" };

  await prisma.portfolioItem.delete({ where: { id: parsed.data.id } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "PORTFOLIO_DELETE",
    entityType: "PortfolioItem",
    entityId: parsed.data.id,
    oldValue: { title: existing.title },
  });

  await revalidatePortfolioPages(user.id);
  return { ok: true };
}
