"use server";

import { NotificationKind, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { createNotificationsForUsers } from "@/server/notifications/service";

type TargetRole = "ALL" | "CUSTOMER" | "EXECUTOR";

export async function sendMarketingCampaignAction(input: {
  title: string;
  body: string;
  targetRole: TargetRole;
}): Promise<ActionResult<{ sent: number }>> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) return { ok: false, error: "Только администратор может отправлять рассылки" };

  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) return { ok: false, error: "Слишком короткий заголовок" };
  if (body.length < 10) return { ok: false, error: "Слишком короткий текст рассылки" };

  const whereRole =
    input.targetRole === "ALL" ? undefined : input.targetRole === "CUSTOMER" ? Role.CUSTOMER : Role.EXECUTOR;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      marketingOptIn: true,
      role: whereRole,
    },
    select: { id: true },
    take: 10000,
  });

  const ids = users.map((u) => u.id);
  if (ids.length === 0) return { ok: true, data: { sent: 0 } };

  const bodyWithUnsubscribe = `${body}\n\n—\nУправление подпиской: /legal/unsubscribe`;
  await createNotificationsForUsers(ids, {
    kind: NotificationKind.GENERIC,
    title: `Рассылка: ${title}`,
    body: bodyWithUnsubscribe,
    link: "/legal/unsubscribe",
  });

  return { ok: true, data: { sent: ids.length } };
}
