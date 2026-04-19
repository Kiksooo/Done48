import nodemailer from "nodemailer";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";

export type SendTransactionalEmailResult =
  | { sent: true; providerMessageId?: string }
  | {
      sent: false;
      reason: "NOT_CONFIGURED" | "MISSING_EMAIL_FROM" | "PROVIDER_ERROR" | "NETWORK";
      detail?: string;
    };

export type TransactionalEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function hasMailerSendTransport(): boolean {
  return Boolean(process.env.MAILERSEND_API_KEY?.trim());
}

function hasSmtpTransport(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function hasResendTransport(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function resolveFromHeader(): string | { error: SendTransactionalEmailResult } {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (process.env.NODE_ENV === "production" && !fromEnv) {
    console.error("[email-outbound] В production задайте EMAIL_FROM.");
    return { error: { sent: false, reason: "MISSING_EMAIL_FROM" } };
  }
  return fromEnv || `DONE48 <${SITE_EMAIL_INFO}>`;
}

async function sendViaMailerSend(
  to: string,
  from: string,
  payload: TransactionalEmailPayload,
): Promise<SendTransactionalEmailResult> {
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
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
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
      console.error("[email-outbound] MailerSend:", res.status, detail.slice(0, 800));
      return { sent: false, reason: "PROVIDER_ERROR", detail: detail.slice(0, 200) };
    }

    const messageId = res.headers.get("x-message-id") ?? undefined;
    return { sent: true, providerMessageId: messageId };
  } catch (e) {
    console.error("[email-outbound] MailerSend сеть:", e);
    return { sent: false, reason: "NETWORK" };
  }
}

async function sendViaSmtp(
  to: string,
  from: string,
  payload: TransactionalEmailPayload,
): Promise<SendTransactionalEmailResult> {
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
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return { sent: true, providerMessageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email-outbound] SMTP:", msg.slice(0, 800));
    return { sent: false, reason: "PROVIDER_ERROR", detail: msg.slice(0, 200) };
  }
}

async function sendViaResend(
  to: string,
  from: string,
  payload: TransactionalEmailPayload,
): Promise<SendTransactionalEmailResult> {
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
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
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
      console.error("[email-outbound] Resend:", res.status, detail.slice(0, 800));
      return { sent: false, reason: "PROVIDER_ERROR", detail: detail.slice(0, 200) };
    }

    let providerMessageId: string | undefined;
    try {
      const j = (await res.json()) as { data?: { id?: string } };
      providerMessageId = j?.data?.id;
    } catch {
      // ignore
    }
    return { sent: true, providerMessageId };
  } catch (e) {
    console.error("[email-outbound] Resend сеть:", e);
    return { sent: false, reason: "NETWORK" };
  }
}

/**
 * Транзакционная почта: MailerSend → SMTP → Resend (как сброс пароля).
 * В production нужен EMAIL_FROM.
 */
export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload,
): Promise<SendTransactionalEmailResult> {
  const fromResolved = resolveFromHeader();
  if (typeof fromResolved !== "string") {
    return fromResolved.error;
  }

  if (hasMailerSendTransport()) {
    return sendViaMailerSend(payload.to, fromResolved, payload);
  }
  if (hasSmtpTransport()) {
    return sendViaSmtp(payload.to, fromResolved, payload);
  }
  if (hasResendTransport()) {
    return sendViaResend(payload.to, fromResolved, payload);
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn("[email-outbound] Нет MAILERSEND_API_KEY / SMTP_HOST / RESEND_API_KEY, письмо не отправлено:", {
      to: payload.to,
      subject: payload.subject,
    });
  } else {
    console.error(
      "[email-outbound] Не настроена почта: задайте MAILERSEND_API_KEY, SMTP_HOST или RESEND_API_KEY.",
    );
  }
  return { sent: false, reason: "NOT_CONFIGURED" };
}
