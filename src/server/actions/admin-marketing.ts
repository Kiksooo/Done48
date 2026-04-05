"use server";

import { NotificationKind, Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  buildMarketingEmailHtml,
  isMailerLiteBroadcastConfigured,
  sendMailerLiteHtmlCampaign,
} from "@/lib/mailerlite";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/orders/create-order";
import { createNotificationsForUsers } from "@/server/notifications/service";

type TargetRole = "ALL" | "CUSTOMER" | "EXECUTOR";

export type MarketingCampaignResult = {
  sent: number;
  mailerLite?:
    | { ok: true; campaignId: string }
    | { ok: false; error: string };
};

export async function sendMarketingCampaignAction(input: {
  title: string;
  body: string;
  targetRole: TargetRole;
  /** Дублировать рассылку email-кампанией MailerLite (группы из MAILERLITE_GROUP_ID). */
  alsoMailerLiteEmail?: boolean;
}): Promise<ActionResult<MarketingCampaignResult>> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) return { ok: false, error: "Только администратор может отправлять рассылки" };

  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) return { ok: false, error: "Слишком короткий заголовок" };
  if (body.length < 10) return { ok: false, error: "Слишком короткий текст рассылки" };

  if (input.alsoMailerLiteEmail && !isMailerLiteBroadcastConfigured()) {
    return {
      ok: false,
      error:
        "Включена отправка через MailerLite, но не заданы MAILERLITE_API_KEY, MAILERLITE_CAMPAIGN_FROM и MAILERLITE_GROUP_ID (см. .env.example).",
    };
  }

  const whereRole =
    input.targetRole === "ALL" ? undefined : input.targetRole === "CUSTOMER" ? Role.CUSTOMER : Role.EXECUTOR;

  try {
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
    if (ids.length === 0) {
      return { ok: true, data: { sent: 0 } };
    }

    const bodyWithUnsubscribe = `${body}\n\n—\nУправление подпиской: /legal/unsubscribe`;
    await createNotificationsForUsers(ids, {
      kind: NotificationKind.GENERIC,
      title: `Рассылка: ${title}`,
      body: bodyWithUnsubscribe,
      link: "/legal/unsubscribe",
    });

    let mailerLite: MarketingCampaignResult["mailerLite"];
    if (input.alsoMailerLiteEmail && isMailerLiteBroadcastConfigured()) {
      const campaignName = `[DONE48] ${title.slice(0, 180)} · ${new Date().toISOString().slice(0, 16)}`;
      const html = buildMarketingEmailHtml(title, body);
      const ml = await sendMailerLiteHtmlCampaign({
        campaignName,
        subject: title.slice(0, 255),
        htmlBody: html,
      });
      mailerLite = ml.ok ? { ok: true, campaignId: ml.campaignId } : { ok: false, error: ml.error };
    }

    return { ok: true, data: { sent: ids.length, mailerLite } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2022" || e.message.includes("marketingOptIn")) {
        return {
          ok: false,
          error:
            "В базе нет полей подписки (marketingOptIn). Выполните на сервере: npx prisma migrate deploy",
        };
      }
    }
    // eslint-disable-next-line no-console
    console.error("[sendMarketingCampaignAction]", e);
    return {
      ok: false,
      error: "Не удалось выполнить рассылку. Проверьте логи сервера и миграции Prisma.",
    };
  }
}
