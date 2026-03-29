/**
 * Отправка ссылки сброса пароля. В проде задайте RESEND_API_KEY и EMAIL_FROM (например onboarding@resend.dev).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[password-reset] Письмо не отправлено (нет RESEND_API_KEY). Ссылка:", resetUrl);
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

export function appBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
