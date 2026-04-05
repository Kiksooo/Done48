import nodemailer from "nodemailer";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";

export type SendPasswordResetEmailResult =
  | { sent: true; providerMessageId?: string }
  | {
      sent: false;
      reason: "NOT_CONFIGURED" | "MISSING_EMAIL_FROM" | "PROVIDER_ERROR" | "NETWORK";
      detail?: string;
    };

const subject = "DONE48 — сброс пароля";

const textBody = (resetUrl: string) =>
  [
    "Запрошен сброс пароля для аккаунта DONE48.",
    "",
    `Откройте ссылку в браузере (действует 1 час):`,
    resetUrl,
    "",
    "Если это не вы, проигнорируйте письмо.",
  ].join("\n");

const htmlBody = (resetUrl: string) =>
  `<p>Запрошен сброс пароля для аккаунта DONE48.</p><p><a href="${resetUrl}">Задать новый пароль</a></p><p>Если кнопка не нажимается, скопируйте ссылку в браузер:<br/><span style="word-break:break-all;font-size:12px">${resetUrl}</span></p><p>Ссылка действует 1 час. Если это не вы, проигнорируйте письмо.</p>`;

function hasSmtpTransport(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function hasResendTransport(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendViaSmtp(
  to: string,
  from: string,
  resetUrl: string,
): Promise<SendPasswordResetEmailResult> {
  const host = process.env.SMTP_HOST!.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const port = portRaw ? parseInt(portRaw, 10) : 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureEnv === "true" || secureEnv === "1" || (!Number.isNaN(port) && port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port: Number.isNaN(port) ? 587 : port,
    secure,
    auth: user ? { user, pass: pass ?? "" } : undefined,
  });

  const text = textBody(resetUrl);
  const html = htmlBody(resetUrl);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    if (info.messageId) {
      // eslint-disable-next-line no-console
      console.info("[password-reset] SMTP принял письмо, Message-ID:", info.messageId);
    }
    return { sent: true, providerMessageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[password-reset] SMTP ошибка:", msg.slice(0, 800));
    return { sent: false, reason: "PROVIDER_ERROR", detail: msg.slice(0, 200) };
  }
}

async function sendViaResend(
  to: string,
  from: string,
  resetUrl: string,
): Promise<SendPasswordResetEmailResult> {
  const key = process.env.RESEND_API_KEY!.trim();
  const html = htmlBody(resetUrl);
  const text = textBody(resetUrl);

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
        subject,
        html,
        text,
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
      return { sent: false, reason: "PROVIDER_ERROR", detail: detail.slice(0, 200) };
    }

    let providerMessageId: string | undefined;
    try {
      const j = (await res.json()) as { data?: { id?: string } };
      providerMessageId = j?.data?.id;
      if (providerMessageId) {
        // eslint-disable-next-line no-console
        console.info("[password-reset] Resend принял письмо, id:", providerMessageId);
      }
    } catch {
      // ignore
    }
    return { sent: true, providerMessageId };
  } catch (e) {
    console.error("[password-reset] Ошибка сети при вызове Resend:", e);
    return { sent: false, reason: "NETWORK" };
  }
}

/**
 * Сброс пароля по почте: приоритетно SMTP (`SMTP_HOST`), иначе Resend (`RESEND_API_KEY`).
 * В production нужен `EMAIL_FROM` (совпадает с разрешённым отправителем у провайдера).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendPasswordResetEmailResult> {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (process.env.NODE_ENV === "production" && !fromEnv) {
    console.error("[password-reset] В production задайте EMAIL_FROM.");
    return { sent: false, reason: "MISSING_EMAIL_FROM" };
  }
  const from = fromEnv || `DONE48 <${SITE_EMAIL_INFO}>`;

  if (hasSmtpTransport()) {
    return sendViaSmtp(to, from, resetUrl);
  }

  if (hasResendTransport()) {
    return sendViaResend(to, from, resetUrl);
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[password-reset] Нет SMTP_HOST и RESEND_API_KEY. Ссылка сброса (только для dev):",
      resetUrl,
    );
  } else {
    console.error(
      "[password-reset] Не настроена почта: задайте SMTP_HOST или RESEND_API_KEY.",
    );
  }
  return { sent: false, reason: "NOT_CONFIGURED" };
}
