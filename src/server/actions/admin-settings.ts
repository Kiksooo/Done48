"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { ensurePlatformSettingsTable } from "@/server/db/ensure-platform-settings";
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

  let before: Awaited<ReturnType<typeof prisma.platformSettings.findUnique>> | null = null;
  try {
    before = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  } catch {
    before = null;
  }
  const minPayoutCents = Math.round(parsed.data.minPayoutRubles * 100);

  try {
    await ensurePlatformSettingsTable();
  } catch (e) {
    console.error("[admin-settings] ensurePlatformSettingsTable failed", e);
    return { ok: false, error: "Не удалось подготовить таблицу настроек в БД." };
  }

  const upsertSettings = async () =>
    prisma.platformSettings.upsert({
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

  try {
    await upsertSettings();
  } catch (e) {
    console.error("[admin-settings] platformSettings.upsert failed", e);
    return { ok: false, error: "Не удалось сохранить настройки. Проверьте права к БД и миграции Prisma." };
  }

  try {
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
  } catch {
    // Аудит не должен блокировать сохранение настроек.
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/executor/balance");
  return { ok: true };
}
