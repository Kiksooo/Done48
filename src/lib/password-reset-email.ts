import nodemailer from "nodemailer";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";

export type SendPasswordResetEmailResult =
  | { sent: true; providerMessageId?: string }
  | {
      sent: false;
      reason: "NOT_CONFIGURED" | "MISSING_EMAIL_FROM" | "PROVIDER_ERROR" | "NETWORK";
      detail?: string;
    };

const emailSubject = "DONE48 — сброс пароля";

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

/* ── transport detection ── */

function hasMailerSendTransport(): boolean {
  return Boolean(process.env.MAILERSEND_API_KEY?.trim());
}

function hasSmtpTransport(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function hasResendTransport(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/* ── MailerSend (HTTP API — works on Vercel) ── */

async function sendViaMailerSend(
  to: string,
  from: string,
  resetUrl: string,
): Promise<SendPasswordResetEmailResult> {
  const key = process.env.MAILERSEND_API_KEY!.trim();

  const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
  const fromEmail = fromMatch ? fromMatch[2] : from;
  const fromName = fromMatch ? fromMatch[1].trim() : undefined;

  try {
    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        from: { email: fromEmail, ...(fromName ? { name: fromName } : {}) },
        to: [{ email: to }],
        subject: emailSubject,
        text: textBody(resetUrl),
        html: htmlBody(resetUrl),
      }),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { message?: string };
        detail = j?.message ?? "";
      } catch {
        detail = `HTTP ${res.status}`;
      }
      console.error("[password-reset] MailerSend отклонил отправку:", res.status, detail.slice(0, 800));
      return { sent: false, reason: "PROVIDER_ERROR", detail: detail.slice(0, 200) };
    }

    const messageId = res.headers.get("x-message-id") ?? undefined;
    if (messageId) {
      // eslint-disable-next-line no-console
      console.info("[password-reset] MailerSend принял письмо, x-message-id:", messageId);
    }
    return { sent: true, providerMessageId: messageId };
  } catch (e) {
    console.error("[password-reset] Ошибка сети при вызове MailerSend:", e);
    return { sent: false, reason: "NETWORK" };
  }
}

/* ── SMTP (nodemailer) ── */

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

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: emailSubject,
      text: textBody(resetUrl),
      html: htmlBody(resetUrl),
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

/* ── Resend (HTTP API) ── */

async function sendViaResend(
  to: string,
  from: string,
  resetUrl: string,
): Promise<SendPasswordResetEmailResult> {
  const key = process.env.RESEND_API_KEY!.trim();

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
        subject: emailSubject,
        html: htmlBody(resetUrl),
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

/* ── main entry ── */

/**
 * Приоритет: MailerSend → SMTP → Resend.
 * В production нужен EMAIL_FROM.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendPasswordResetEmailResult> {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (process.env.NODE_ENV === "production" && !fromEnv) {
    console.error("[password-reset] В production задайте EMAIL_FROM.");
    return { sent: false, reason: "MISSING_EMAIL_FROM" };
  }
  const from = fromEnv || `DONE48 <${SITE_EMAIL_INFO}>`;

  if (hasMailerSendTransport()) {
    return sendViaMailerSend(to, from, resetUrl);
  }

  if (hasSmtpTransport()) {
    return sendViaSmtp(to, from, resetUrl);
  }

  if (hasResendTransport()) {
    return sendViaResend(to, from, resetUrl);
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[password-reset] Нет MAILERSEND_API_KEY / SMTP_HOST / RESEND_API_KEY. Ссылка сброса (только для dev):",
      resetUrl,
    );
  } else {
    console.error(
      "[password-reset] Не настроена почта: задайте MAILERSEND_API_KEY, SMTP_HOST или RESEND_API_KEY.",
    );
  }
  return { sent: false, reason: "NOT_CONFIGURED" };
}
