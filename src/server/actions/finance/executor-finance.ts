"use server";

import { PayoutStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { payoutRequestSchema } from "@/schemas/finance";
import type { ActionResult } from "@/server/actions/orders/create-order";

export async function executorRequestPayoutAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Только для исполнителя" };
  }

  const parsed = payoutRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const amountCents = Math.round(parsed.data.amountRubles * 100);

  const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const minCents = settings?.minPayoutCents ?? 1000;
  if (amountCents < minCents) {
    return { ok: false, error: `Минимальная сумма вывода: ${(minCents / 100).toFixed(0)} ₽` };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const profile = await tx.executorProfile.findUnique({ where: { userId: user.id } });
        if (!profile) throw new Error("NO_PROFILE");

        const reservedAgg = await tx.payout.aggregate({
          where: {
            executorId: user.id,
            status: { in: [PayoutStatus.PENDING, PayoutStatus.APPROVED] },
          },
          _sum: { amountCents: true },
        });
        const reservedCents = reservedAgg._sum.amountCents ?? 0;
        const available = profile.heldCents + profile.balanceCents - reservedCents;
        if (amountCents > available) {
          throw new Error("INSUFFICIENT");
        }

        await tx.payout.create({
          data: {
            executorId: user.id,
            amountCents,
            currency: "RUB",
            payoutDetails: parsed.data.payoutDetails,
            status: PayoutStatus.PENDING,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_PROFILE") return { ok: false, error: "Профиль исполнителя не найден" };
    if (msg === "INSUFFICIENT") {
      return {
        ok: false,
        error:
          "Недостаточно доступных средств (холд, баланс и незавершённые заявки на вывод)",
      };
    }
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034") {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidatePath("/executor/balance");
  revalidatePath("/admin/payouts");
  return { ok: true };
}
