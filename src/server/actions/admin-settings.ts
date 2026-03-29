"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { adminUpdatePlatformSettingsSchema } from "@/schemas/settings";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

export async function adminUpdatePlatformSettingsAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminUpdatePlatformSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const before = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const minPayoutCents = Math.round(parsed.data.minPayoutRubles * 100);

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      platformFeePercent: new Prisma.Decimal(parsed.data.platformFeePercent),
      minPayoutCents,
      moderateAllNewOrders: parsed.data.moderateAllNewOrders,
      requireExecutorVerificationForProposals: parsed.data.requireExecutorVerificationForProposals,
      maxExecutorProposalsPerDay: parsed.data.maxExecutorProposalsPerDay,
    },
    update: {
      platformFeePercent: new Prisma.Decimal(parsed.data.platformFeePercent),
      minPayoutCents,
      moderateAllNewOrders: parsed.data.moderateAllNewOrders,
      requireExecutorVerificationForProposals: parsed.data.requireExecutorVerificationForProposals,
      maxExecutorProposalsPerDay: parsed.data.maxExecutorProposalsPerDay,
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: "PLATFORM_SETTINGS_UPDATE",
    entityType: "PlatformSettings",
    entityId: "default",
    oldValue: before
      ? {
          platformFeePercent: Number(before.platformFeePercent),
          minPayoutCents: before.minPayoutCents,
          moderateAllNewOrders: before.moderateAllNewOrders,
          requireExecutorVerificationForProposals: before.requireExecutorVerificationForProposals,
          maxExecutorProposalsPerDay: before.maxExecutorProposalsPerDay,
        }
      : null,
    newValue: {
      platformFeePercent: parsed.data.platformFeePercent,
      minPayoutCents,
      moderateAllNewOrders: parsed.data.moderateAllNewOrders,
      requireExecutorVerificationForProposals: parsed.data.requireExecutorVerificationForProposals,
      maxExecutorProposalsPerDay: parsed.data.maxExecutorProposalsPerDay,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/executor/balance");
  return { ok: true };
}
