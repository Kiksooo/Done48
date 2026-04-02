/**
 * Синхронизация opt-in подписки с MailerLite (Marketing → API token).
 * @see https://developers.mailerlite.com/docs/subscribers.html
 */

const API = "https://connect.mailerlite.com/api/subscribers";

export function isMailerLiteConfigured(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY?.trim());
}

function bearer(): string {
  return process.env.MAILERLITE_API_KEY!.trim();
}

/** Несколько id через запятую или пробел. */
function groupIds(): string[] {
  const raw = process.env.MAILERLITE_GROUP_ID?.trim() ?? "";
  return raw.split(/[\s,]+/).filter(Boolean);
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
    const res = await fetch(API, {
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
