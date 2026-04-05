import { SITE_EMAIL_INFO } from "@/lib/site-contact";

export type SendPasswordResetEmailResult =
  | { sent: true }
  | { sent: false; reason: "NO_API_KEY" | "RESEND_HTTP" | "NETWORK"; detail?: string };

const textBody = (resetUrl: string) =>
  [
    "Запрошен сброс пароля для аккаунта DONE48.",
    "",
    `Откройте ссылку в браузере (действует 1 час):`,
    resetUrl,
    "",
    "Если это не вы, проигнорируйте письмо.",
  ].join("\n");

/**
 * Отправка ссылки сброса пароля через Resend.
 * Нужен RESEND_API_KEY; EMAIL_FROM — адрес с подтверждённым в Resend доменом (иначе API вернёт ошибку).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendPasswordResetEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || `DONE48 <${SITE_EMAIL_INFO}>`;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[password-reset] Нет RESEND_API_KEY. Ссылка сброса (только для dev):", resetUrl);
    } else {
      console.error("[password-reset] RESEND_API_KEY не задан — письмо сброса пароля не отправлено.");
    }
    return { sent: false, reason: "NO_API_KEY" };
  }

  const html = `<p>Запрошен сброс пароля для аккаунта DONE48.</p><p><a href="${resetUrl}">Задать новый пароль</a></p><p>Если кнопка не нажимается, скопируйте ссылку в браузер:<br/><span style="word-break:break-all;font-size:12px">${resetUrl}</span></p><p>Ссылка действует 1 час. Если это не вы, проигнорируйте письмо.</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "DONE48 — сброс пароля",
        html,
        text: textBody(resetUrl),
      }),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { message?: string; name?: string };
        detail = [j?.name, j?.message].filter(Boolean).join(": ") || (await res.text());
      } catch {
        detail = `HTTP ${res.status}`;
      }
      console.error("[password-reset] Resend отклонил отправку:", res.status, detail.slice(0, 800));
      return { sent: false, reason: "RESEND_HTTP", detail: detail.slice(0, 200) };
    }

    return { sent: true };
  } catch (e) {
    console.error("[password-reset] Ошибка сети при вызове Resend:", e);
    return { sent: false, reason: "NETWORK" };
  }
}
