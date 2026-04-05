/**
 * MailerLite (connect.mailerlite.com): подписчики + опционально email-кампании.
 * Токен: Integrations → MailerLite API → сгенерировать (Bearer JWT).
 * @see https://developers.mailerlite.com/docs/subscribers.html
 * @see https://developers.mailerlite.com/docs/campaigns.html
 */

const API_BASE = "https://connect.mailerlite.com/api";

export function isMailerLiteConfigured(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY?.trim());
}

/** Готовность к отправке кампании: ключ, подтверждённый From в MailerLite, хотя бы одна группа. */
export function isMailerLiteBroadcastConfigured(): boolean {
  if (!isMailerLiteConfigured()) return false;
  const from = process.env.MAILERLITE_CAMPAIGN_FROM?.trim();
  return Boolean(from) && groupIds().length > 0;
}

function bearer(): string {
  return process.env.MAILERLITE_API_KEY!.trim();
}

/** Несколько id через запятую или пробел. */
function groupIds(): string[] {
  const raw = process.env.MAILERLITE_GROUP_ID?.trim() ?? "";
  return raw.split(/[\s,]+/).filter(Boolean);
}

type ApiResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; text: string };

async function mailerLiteRequest(path: string, init: { method: string; json?: unknown }): Promise<ApiResult> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${bearer()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers,
    body: JSON.stringify(init.json),
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, text: text.slice(0, 1200) };
  }
  try {
    return { ok: true, status: res.status, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: true, status: res.status, data: text };
  }
}

/**
 * Upsert подписчика: при подписке — active + группы (если заданы) + resubscribe;
 * при отписке — status unsubscribed.
 * Ошибки API только в лог; не бросает наружу.
 */
export async function syncMailerLiteSubscriber(params: {
  email: string;
  subscribed: boolean;
  name?: string | null;
}): Promise<void> {
  if (!isMailerLiteConfigured()) return;
  const email = params.email.trim().toLowerCase();
  if (!email) return;

  const body: Record<string, unknown> = {
    email,
    status: params.subscribed ? "active" : "unsubscribed",
  };

  if (params.subscribed) {
    body.resubscribe = true;
    const groups = groupIds();
    if (groups.length > 0) body.groups = groups;
    const n = params.name?.trim();
    if (n) body.fields = { name: n };
  }

  try {
    const res = await fetch(`${API_BASE}/subscribers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.error("[mailerlite] subscribers upsert failed:", res.status, text.slice(0, 500));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[mailerlite] subscribers upsert error:", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Простое HTML из текста рассылки + отписка (требования MailerLite к футеру). */
export function buildMarketingEmailHtml(title: string, bodyText: string): string {
  const paras = bodyText
    .split(/\n+/)
    .map((p) => `<p>${escapeHtml(p) || "&nbsp;"}</p>`)
    .join("\n");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const unsub = site
    ? `<p style="margin-top:24px;font-size:12px;color:#666;"><a href="${escapeHtml(`${site}/legal/unsubscribe`)}">Отписаться от рассылки</a></p>`
    : `<p style="margin-top:24px;font-size:12px;color:#666;">Отписка: настройки профиля или раздел «Юридическое» на сайте.</p>`;
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;max-width:600px;">${paras}<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/><p style="font-size:12px;color:#666;">${escapeHtml(
    title,
  )}</p>${unsub}</body></html>`;
}

/**
 * Создаёт regular-кампанию с HTML и сразу ставит delivery instant.
 * Нужен тариф с custom HTML, если MailerLite отклонит — вернётся ошибка API.
 */
export async function sendMailerLiteHtmlCampaign(params: {
  campaignName: string;
  subject: string;
  htmlBody: string;
}): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  if (!isMailerLiteBroadcastConfigured()) {
    return {
      ok: false,
      error:
        "Задайте MAILERLITE_API_KEY, MAILERLITE_CAMPAIGN_FROM (подтверждённый отправитель в MailerLite) и MAILERLITE_GROUP_ID.",
    };
  }
  const from = process.env.MAILERLITE_CAMPAIGN_FROM!.trim();
  const fromName = process.env.MAILERLITE_CAMPAIGN_FROM_NAME?.trim() || "DONE48";
  const groups = groupIds();

  const created = await mailerLiteRequest("/campaigns", {
    method: "POST",
    json: {
      name: params.campaignName.slice(0, 255),
      type: "regular",
      emails: [
        {
          subject: params.subject.slice(0, 255),
          from,
          from_name: fromName,
          content: params.htmlBody,
        },
      ],
      groups,
    },
  });

  if (!created.ok) {
    return {
      ok: false,
      error: `Создание кампании: HTTP ${created.status} — ${created.text}`,
    };
  }

  const campaignId = (created.data as { data?: { id?: string } })?.data?.id;
  if (!campaignId) {
    return { ok: false, error: "MailerLite: в ответе нет id кампании" };
  }

  const scheduled = await mailerLiteRequest(`/campaigns/${campaignId}/schedule`, {
    method: "POST",
    json: { delivery: "instant" },
  });

  if (!scheduled.ok) {
    return {
      ok: false,
      error: `Кампания ${campaignId} создана, но отправка не запущена: HTTP ${scheduled.status} — ${scheduled.text}`,
    };
  }

  return { ok: true, campaignId };
}
