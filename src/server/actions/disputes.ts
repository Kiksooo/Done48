"use server";

import {
  DisputeStatus,
  NotificationKind,
  OrderStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import { appendStatusHistory } from "@/server/orders/status";
import { adminUpdateDisputeSchema, openDisputeSchema } from "@/schemas/dispute";
import { notifyActiveAdmins, notifySafe } from "@/server/notifications/service";
import type { ActionResult } from "@/server/actions/orders/create-order";

const OPEN_DISPUTE_STATUSES: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.SUBMITTED,
  OrderStatus.REVISION,
  OrderStatus.ACCEPTED,
];

function revalidateDisputePaths(orderId: string) {
  revalidatePath("/admin/disputes");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/audit-logs");
  revalidatePath("/customer/orders");
  revalidatePath("/executor/orders");
}

export async function openDisputeAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || (user.role !== Role.CUSTOMER && user.role !== Role.EXECUTOR)) {
    return { ok: false, error: "Доступно заказчику или исполнителю" };
  }

  const parsed = openDisputeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  let orderIdForNotify = "";
  let orderTitle = "";
  let fromStatus: OrderStatus = OrderStatus.NEW;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: parsed.data.orderId } });
        if (!ord) {
          throw new Error("ORDER_NOT_FOUND");
        }
        if (user.role === Role.CUSTOMER && ord.customerId !== user.id) {
          throw new Error("FORBIDDEN");
        }
        if (user.role === Role.EXECUTOR && ord.executorId !== user.id) {
          throw new Error("FORBIDDEN");
        }
        if (!OPEN_DISPUTE_STATUSES.includes(ord.status)) {
          throw new Error("BAD_STATUS");
        }

        const existing = await tx.dispute.findFirst({
          where: {
            orderId: ord.id,
            status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW] },
          },
        });
        if (existing) {
          throw new Error("DUPLICATE_DISPUTE");
        }

        const ou = await tx.order.updateMany({
          where: {
            id: ord.id,
            status: { in: OPEN_DISPUTE_STATUSES },
          },
          data: { status: OrderStatus.DISPUTED },
        });
        if (ou.count !== 1) {
          throw new Error("ORDER_STATE");
        }

        await tx.dispute.create({
          data: {
            orderId: ord.id,
            openedById: user.id,
            reason: parsed.data.reason,
            status: DisputeStatus.OPEN,
          },
        });

        fromStatus = ord.status;
        orderIdForNotify = ord.id;
        orderTitle = ord.title;

        await appendStatusHistory(tx, {
          orderId: ord.id,
          fromStatus,
          toStatus: OrderStatus.DISPUTED,
          actorUserId: user.id,
          note: "Открыт спор",
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ORDER_NOT_FOUND") return { ok: false, error: "Заказ не найден" };
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа" };
    if (msg === "BAD_STATUS") {
      return { ok: false, error: "Спор для этого статуса заказа недоступен" };
    }
    if (msg === "DUPLICATE_DISPUTE") {
      return { ok: false, error: "По заказу уже открыт спор" };
    }
    if (msg === "ORDER_STATE") {
      return { ok: false, error: "Статус заказа изменился, обновите страницу" };
    }
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "DISPUTE_OPEN",
    entityType: "Order",
    entityId: orderIdForNotify,
    oldValue: { status: fromStatus },
    newValue: { status: OrderStatus.DISPUTED },
  });

  revalidateDisputePaths(orderIdForNotify);

  notifySafe(async () => {
    await notifyActiveAdmins({
      kind: NotificationKind.DISPUTE_OPENED,
      title: "Открыт спор",
      body: orderTitle,
      link: `/orders/${orderIdForNotify}`,
    });
  });

  return { ok: true };
}

export async function adminUpdateDisputeAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = adminUpdateDisputeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const dFull = await prisma.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { order: { select: { id: true, status: true } } },
  });
  if (!dFull) return { ok: false, error: "Спор не найден" };

  const before = { status: dFull.status, resolution: dFull.resolution };

  const terminal: DisputeStatus[] = [
    DisputeStatus.RESOLVED_CUSTOMER,
    DisputeStatus.RESOLVED_EXECUTOR,
    DisputeStatus.PARTIAL,
    DisputeStatus.CLOSED,
  ];
  const resumeWork =
    terminal.includes(parsed.data.status) && dFull.order.status === OrderStatus.DISPUTED;

  const resTrim = parsed.data.resolution?.trim();
  let historyNote = `Спор завершён (${parsed.data.status})`;
  if (resTrim) {
    historyNote += ` · ${resTrim.slice(0, 180)}`;
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: dFull.id },
      data: {
        status: parsed.data.status,
        resolution: parsed.data.resolution ?? undefined,
      },
    });

    if (resumeWork) {
      await tx.order.update({
        where: { id: dFull.order.id },
        data: { status: OrderStatus.IN_PROGRESS },
      });
      await appendStatusHistory(tx, {
        orderId: dFull.order.id,
        fromStatus: OrderStatus.DISPUTED,
        toStatus: OrderStatus.IN_PROGRESS,
        actorUserId: user.id,
        note: historyNote,
      });
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "DISPUTE_UPDATE",
    entityType: "Dispute",
    entityId: dFull.id,
    oldValue: before,
    newValue: {
      status: parsed.data.status,
      resolution: parsed.data.resolution ?? null,
    },
  });

  revalidateDisputePaths(dFull.order.id);
  return { ok: true };
}
