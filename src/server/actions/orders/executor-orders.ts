"use server";

import {
  ExecutorAccountStatus,
  NotificationKind,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Role,
  VerificationStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAntifraudPlatformSettings } from "@/lib/platform-antifraud";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import { createProposalSchema, customerOrderActionSchema } from "@/schemas/order";
import { assertOrderWritableByExecutor, canExecutorSeePublishedOpen } from "@/server/orders/access";
import { appendStatusHistory } from "@/server/orders/status";
import {
  createNotification,
  notifyActiveAdmins,
  notifySafe,
} from "@/server/notifications/service";
import type { ActionResult } from "./create-order";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/executor/orders");
  revalidatePath("/executor/orders/available");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/customer/orders");
}

export async function executorCreateProposalAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = createProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const offeredCents =
    parsed.data.offeredRubles !== undefined
      ? Math.round(parsed.data.offeredRubles * 100)
      : undefined;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { executorProfile: true },
  });
  if (!profile?.isActive) {
    return { ok: false, error: "Учётная запись отключена" };
  }
  const ep = profile.executorProfile;
  if (!ep || ep.accountStatus !== ExecutorAccountStatus.ACTIVE) {
    return {
      ok: false,
      error:
        "Отклики доступны при статусе исполнителя «Активен» после одобрения анкеты администратором (раздел админки «Исполнители»). Пока заявка на рассмотрении — дождитесь решения.",
    };
  }

  const af = await getAntifraudPlatformSettings();
  if (af.requireExecutorVerificationForProposals && ep.verificationStatus !== VerificationStatus.APPROVED) {
    return {
      ok: false,
      error:
        "Чтобы откликаться на заказы, пройдите верификацию: загрузите документы в профиле исполнителя и дождитесь одобрения.",
    };
  }

  if (af.maxExecutorProposalsPerDay > 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await prisma.proposal.count({
      where: { executorId: user.id, createdAt: { gte: since } },
    });
    if (recent >= af.maxExecutorProposalsPerDay) {
      return {
        ok: false,
        error: `Достигнут лимит откликов за сутки (${af.maxExecutorProposalsPerDay}). Попробуйте позже — это снижает спам и накрутку.`,
      };
    }
  }

  let orderIdNotify = "";
  let orderTitleNotify = "";
  let customerIdNotify = "";

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({ where: { id: parsed.data.orderId } });
        if (!order || !canExecutorSeePublishedOpen(order)) {
          throw new Error("NO_ORDER");
        }

        const existing = await tx.proposal.findFirst({
          where: { orderId: order.id, executorId: user.id },
        });
        if (existing) {
          throw new Error("DUPE");
        }

        await tx.proposal.create({
          data: {
            orderId: order.id,
            executorId: user.id,
            offeredCents,
            offeredDays: parsed.data.offeredDays,
            message: parsed.data.message,
          },
        });

        orderIdNotify = order.id;
        orderTitleNotify = order.title;
        customerIdNotify = order.customerId;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_ORDER") return { ok: false, error: "Отклик недоступен для этого заказа" };
    if (msg === "DUPE") return { ok: false, error: "Вы уже откликались на этот заказ" };
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderIdNotify);
  revalidatePath("/admin/proposals");

  notifySafe(async () => {
    await createNotification({
      userId: customerIdNotify,
      kind: NotificationKind.NEW_PROPOSAL,
      title: "Новый отклик на заказ",
      body: `«${orderTitleNotify}»`,
      link: `/orders/${orderIdNotify}`,
    });
    await notifyActiveAdmins({
      kind: NotificationKind.GENERIC,
      title: "Новый отклик",
      body: orderTitleNotify,
      link: `/orders/${orderIdNotify}`,
    });
  });

  return { ok: true };
}

export async function executorStartWorkAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByExecutor(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  if (check.order.status !== OrderStatus.ASSIGNED) {
    return { ok: false, error: "Старт работы доступен после назначения" };
  }
  if (check.order.paymentStatus !== PaymentStatus.RESERVED) {
    return {
      ok: false,
      error:
        "Заказчик ещё не внёс сумму в безопасную сделку. Начать работу можно после блокировки средств на площадке.",
    };
  }

  const orderId = check.order.id;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            executorId: user.id,
            status: OrderStatus.ASSIGNED,
            paymentStatus: PaymentStatus.RESERVED,
          },
          data: { status: OrderStatus.IN_PROGRESS },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }
        await appendStatusHistory(tx, {
          orderId,
          fromStatus: OrderStatus.ASSIGNED,
          toStatus: OrderStatus.IN_PROGRESS,
          actorUserId: user.id,
          note: "Работа начата",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "STATE") {
      return { ok: false, error: "Старт работы недоступен для текущего статуса" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);

  notifySafe(async () => {
    await createNotification({
      userId: check.order.customerId,
      kind: NotificationKind.GENERIC,
      title: "Исполнитель начал работу",
      body: `Заказ: ${check.order.title}`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}

export async function executorSubmitWorkAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerOrderActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const check = await assertOrderWritableByExecutor(parsed.data.orderId, user.id);
  if (!check.ok || !check.order) return { ok: false, error: "Нет доступа" };

  if (
    check.order.status !== OrderStatus.IN_PROGRESS &&
    check.order.status !== OrderStatus.REVISION
  ) {
    return { ok: false, error: "Сдача недоступна для текущего статуса" };
  }

  const orderId = check.order.id;
  const allowedSubmit: OrderStatus[] = [OrderStatus.IN_PROGRESS, OrderStatus.REVISION];

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: orderId } });
        if (!ord || ord.executorId !== user.id || !allowedSubmit.includes(ord.status)) {
          throw new Error("STATE");
        }
        const ou = await tx.order.updateMany({
          where: {
            id: orderId,
            executorId: user.id,
            status: { in: allowedSubmit },
          },
          data: { status: OrderStatus.SUBMITTED },
        });
        if (ou.count !== 1) {
          throw new Error("STATE");
        }
        await appendStatusHistory(tx, {
          orderId,
          fromStatus: ord.status,
          toStatus: OrderStatus.SUBMITTED,
          actorUserId: user.id,
          note: "Результат сдан",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "STATE") {
      return { ok: false, error: "Сдача недоступна для текущего статуса" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidateOrderPaths(orderId);

  notifySafe(async () => {
    await createNotification({
      userId: check.order.customerId,
      kind: NotificationKind.WORK_SUBMITTED,
      title: "Результат сдан",
      body: `Заказ: ${check.order.title}`,
      link: `/orders/${orderId}`,
    });
  });

  return { ok: true };
}
