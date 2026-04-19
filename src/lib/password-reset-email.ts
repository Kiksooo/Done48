import { sendTransactionalEmail, type SendTransactionalEmailResult } from "@/lib/email-outbound";

export type SendPasswordResetEmailResult = SendTransactionalEmailResult;

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

/**
 * Приоритет провайдера: MailerSend → SMTP → Resend (см. {@link sendTransactionalEmail}).
 * В production нужен EMAIL_FROM.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendPasswordResetEmailResult> {
  const result = await sendTransactionalEmail({
    to,
    subject: emailSubject,
    text: textBody(resetUrl),
    html: htmlBody(resetUrl),
  });

  if (result.sent === false && result.reason === "NOT_CONFIGURED" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[password-reset] Нет MAILERSEND_API_KEY / SMTP_HOST / RESEND_API_KEY. Ссылка сброса (только для dev):",
      resetUrl,
    );
  }

  return result;
}
