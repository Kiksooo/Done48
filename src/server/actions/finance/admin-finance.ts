"use server";

import { NotificationKind, PayoutStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import { adminPayoutActionSchema } from "@/schemas/finance";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { createNotification, notifySafe } from "@/server/notifications/service";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

export async function adminApprovePayoutAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminPayoutActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const approved = await prisma.payout.updateMany({
    where: { id: parsed.data.payoutId, status: PayoutStatus.PENDING },
    data: {
      status: PayoutStatus.APPROVED,
      adminNote: parsed.data.adminNote ?? undefined,
    },
  });
  if (approved.count !== 1) {
    return { ok: false, error: "Заявка не найдена или уже обработана" };
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/executor/balance");
  return { ok: true };
}

export async function adminRejectPayoutAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminPayoutActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const rejected = await prisma.payout.updateMany({
    where: { id: parsed.data.payoutId, status: PayoutStatus.PENDING },
    data: {
      status: PayoutStatus.REJECTED,
      adminNote: parsed.data.adminNote ?? undefined,
    },
  });
  if (rejected.count !== 1) {
    return { ok: false, error: "Заявка не найдена или уже обработана" };
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/executor/balance");
  return { ok: true };
}

export async function adminMarkPayoutPaidAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminPayoutActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  let notifyExecutorId = "";
  let notifyAmountCents = 0;
  let notifyCurrency = "RUB";

  try {
    await prisma.$transaction(
      async (tx) => {
        const p = await tx.payout.findUnique({ where: { id: parsed.data.payoutId } });
        if (!p || p.status !== PayoutStatus.APPROVED) {
          throw new Error("PAYOUT_STATE");
        }

        const profile = await tx.executorProfile.findUnique({ where: { userId: p.executorId } });
        if (!profile) throw new Error("NO_PROFILE");

        let need = p.amountCents;
        const takeHeld = Math.min(need, profile.heldCents);
        need -= takeHeld;
        const takeBal = Math.min(need, profile.balanceCents);
        need -= takeBal;
        if (need > 0) throw new Error("INSUFFICIENT");

        const profUp = await tx.executorProfile.updateMany({
          where: {
            userId: p.executorId,
            heldCents: { gte: takeHeld },
            balanceCents: { gte: takeBal },
          },
          data: {
            heldCents: { decrement: takeHeld },
            balanceCents: { decrement: takeBal },
          },
        });
        if (profUp.count !== 1) throw new Error("PROFILE_RACE");

        await tx.transaction.create({
          data: {
            type: "PAYOUT",
            amountCents: p.amountCents,
            currency: p.currency,
            fromUserId: p.executorId,
            meta: { payoutId: p.id, note: "Выплата специалисту" },
          },
        });

        const payUp = await tx.payout.updateMany({
          where: { id: p.id, status: PayoutStatus.APPROVED },
          data: {
            status: PayoutStatus.PAID,
            adminNote: parsed.data.adminNote ?? undefined,
          },
        });
        if (payUp.count !== 1) throw new Error("PAYOUT_RACE");

        notifyExecutorId = p.executorId;
        notifyAmountCents = p.amountCents;
        notifyCurrency = p.currency;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PAYOUT_STATE") {
      return { ok: false, error: "Нужна заявка в статусе «Одобрено»" };
    }
    if (msg === "NO_PROFILE") return { ok: false, error: "Профиль специалиста не найден" };
    if (msg === "INSUFFICIENT") {
      return { ok: false, error: "У специалиста недостаточно средств (холд + баланс)" };
    }
    if (msg === "PROFILE_RACE" || msg === "PAYOUT_RACE") {
      return { ok: false, error: "Данные изменились, обновите страницу и попробуйте снова" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/admin/payments");
  revalidatePath("/executor/balance");

  notifySafe(async () => {
    await createNotification({
      userId: notifyExecutorId,
      kind: NotificationKind.PAYOUT_CONFIRMED,
      title: "Выплата отмечена как отправленная",
      body: `${(notifyAmountCents / 100).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${notifyCurrency}`,
      link: "/executor/balance",
    });
  });

  return { ok: true };
}
