"use server";

import { OrderStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";
import { getSessionUserForAction } from "@/lib/rbac";
import { createReviewSchema } from "@/schemas/review";
import type { ActionResult } from "@/server/actions/orders/create-order";

const REVIEWABLE_STATUSES: OrderStatus[] = [OrderStatus.ACCEPTED, OrderStatus.COMPLETED];

export async function createReviewAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || (user.role !== Role.CUSTOMER && user.role !== Role.EXECUTOR)) {
    return { ok: false, error: "Отзыв могут оставить заказчик или специалист по завершённому заказу" };
  }

  const parsed = createReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { orderId, toUserId, rating, text } = parsed.data;

  if (toUserId === user.id) {
    return { ok: false, error: "Нельзя оставить отзыв самому себе" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || !REVIEWABLE_STATUSES.includes(order.status)) {
        throw new Error("ORDER_STATE");
      }

      if (user.role === Role.CUSTOMER) {
        if (order.customerId !== user.id) throw new Error("FORBIDDEN");
        if (!order.executorId || order.executorId !== toUserId) throw new Error("TARGET");
      } else {
        if (order.executorId !== user.id) throw new Error("FORBIDDEN");
        if (order.customerId !== toUserId) throw new Error("TARGET");
      }

      const existing = await tx.review.findUnique({
        where: { orderId_fromUserId: { orderId, fromUserId: user.id } },
      });
      if (existing) throw new Error("DUPE");

      await tx.review.create({
        data: {
          orderId,
          fromUserId: user.id,
          toUserId,
          rating,
          text: text ?? null,
        },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return { ok: false, error: "Нет доступа к этому заказу" };
    if (msg === "TARGET") {
      return { ok: false, error: "Отзыв можно оставить только второй стороне сделки по этому заказу" };
    }
    if (msg === "ORDER_STATE") {
      return { ok: false, error: "Отзывы доступны после приёмки работы (статус заказа «Принято» или «Завершён»)" };
    }
    if (msg === "DUPE") return { ok: false, error: "Вы уже оставили отзыв по этому заказу" };
    if (isPrismaTransactionConflict(e)) {
      return { ok: false, error: "Конфликт при сохранении, попробуйте ещё раз" };
    }
    throw e;
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/customer/profile");
  revalidatePath("/executor/profile");

  const toUser = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { executorProfile: { select: { username: true } } },
  });
  const un = toUser?.executorProfile?.username;
  if (un) {
    revalidatePath(`/u/${un}`);
    revalidatePath("/executors");
  }

  return { ok: true };
}
