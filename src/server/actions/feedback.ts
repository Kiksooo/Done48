"use server";

import { NotificationKind } from "@prisma/client";
import { getSessionUserForAction } from "@/lib/rbac";
import { notifyActiveAdmins, notifySafe } from "@/server/notifications/service";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { writeAuditLog } from "@/server/audit/log";
import { submitFeedbackSchema } from "@/schemas/feedback";

function buildFeedbackBody(payload: {
  name?: string;
  email?: string;
  message: string;
}): string {
  const lines: string[] = [];
  if (payload.name) lines.push(`Имя: ${payload.name}`);
  if (payload.email) lines.push(`Email: ${payload.email}`);
  lines.push(`Сообщение:`);
  lines.push(payload.message);
  return lines.join("\n");
}

export async function submitFeedbackAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  const parsed = submitFeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const body = buildFeedbackBody(parsed.data);

  // Пишем в кабинет админа как уведомление (чтобы быстро увидеть обращение).
  notifySafe(async () => {
    await notifyActiveAdmins({
      kind: NotificationKind.GENERIC,
      title: "Новая обратная связь",
      body,
      link: "/admin/notifications",
    });
  });

  // Аудит — best-effort.
  try {
    await writeAuditLog({
      actorUserId: user?.id ?? null,
      action: "FEEDBACK_SUBMIT",
      entityType: "Feedback",
      entityId: null,
      newValue: {
        name: parsed.data.name ?? null,
        email: parsed.data.email ?? null,
      },
    });
  } catch {
    // не блокируем
  }

  return { ok: true };
}

