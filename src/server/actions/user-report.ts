"use server";

import { NotificationKind, ProposalStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { submitUserReportSchema } from "@/schemas/trust";
import { assertOrderReadable } from "@/server/orders/access";
import { notifyActiveAdmins, notifySafe } from "@/server/notifications/service";
import type { ActionResult } from "@/server/actions/orders/create-order";

const MAX_REPORTS_PER_DAY = 12;

export async function submitUserReportAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role === Role.ADMIN) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = submitUserReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const access = await assertOrderReadable({
    orderId: parsed.data.orderId,
    userId: user.id,
    role: user.role as Role,
  });
  if (!access.ok) {
    return { ok: false, error: "Заказ недоступен" };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
  });
  if (!order) return { ok: false, error: "Заказ не найден" };

  let targetUserId: string | null = null;
  if (user.role === Role.CUSTOMER && user.id === order.customerId) {
    if (order.executorId) targetUserId = order.executorId;
  } else if (user.role === Role.EXECUTOR) {
    const assigned = order.executorId === user.id;
    const pendingProposal = assigned
      ? null
      : await prisma.proposal.findFirst({
          where: {
            orderId: order.id,
            executorId: user.id,
            status: ProposalStatus.PENDING,
          },
        });
    if (assigned || pendingProposal) {
      targetUserId = order.customerId;
    }
  }

  if (!targetUserId || targetUserId === user.id) {
    return {
      ok: false,
      error: "Жалобу можно отправить на контрагента по заказу: заказчик — на назначенного исполнителя, исполнитель — на заказчика при отклике или назначении.",
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.userReport.count({
    where: { reporterId: user.id, createdAt: { gte: since } },
  });
  if (recent >= MAX_REPORTS_PER_DAY) {
    return { ok: false, error: "Превышен лимит жалоб за сутки. Если срочно — напишите на контакт в подвале сайта." };
  }

  await prisma.userReport.create({
    data: {
      reporterId: user.id,
      targetUserId,
      orderId: order.id,
      category: parsed.data.category,
      description: parsed.data.description,
    },
  });

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/admin/moderation");
  revalidatePath("/executors");
  const targetProfile = await prisma.executorProfile.findUnique({
    where: { userId: targetUserId },
    select: { username: true },
  });
  if (targetProfile?.username) revalidatePath(`/u/${targetProfile.username}`);

  notifySafe(async () => {
    await notifyActiveAdmins({
      kind: NotificationKind.GENERIC,
      title: "Новая жалоба пользователя",
      body: `По заказу «${order.title.slice(0, 80)}${order.title.length > 80 ? "…" : ""}»`,
      link: "/admin/moderation",
    });
  });

  return { ok: true };
}
