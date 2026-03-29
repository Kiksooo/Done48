import { SITE_EMAIL_INFO } from "@/lib/site-contact";

/**
 * Отправка ссылки сброса пароля. Нужен RESEND_API_KEY; EMAIL_FROM по умолчанию — info@done48.ru (домен должен быть подтверждён в Resend).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim() || `DONE48 <${SITE_EMAIL_INFO}>`;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[password-reset] Нет RESEND_API_KEY. Ссылка сброса:", resetUrl);
    }
    return false;
  }

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
        html: `<p>Запрошен сброс пароля для аккаунта DONE48.</p><p><a href="${resetUrl}">Задать новый пароль</a></p><p>Ссылка действует 1 час. Если это не вы, проигнорируйте письмо.</p>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
