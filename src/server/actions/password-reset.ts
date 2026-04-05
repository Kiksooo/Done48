"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { appBaseUrl } from "@/lib/site-url";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export type PasswordResetResult = { ok: true } | { ok: false; error: string };

/** Результат запроса ссылки сброса (флаг почты из env — без утечки «есть ли аккаунт»). */
export type RequestPasswordResetResult =
  | { ok: false; error: string }
  | {
      ok: true;
      /** Настроен SMTP или Resend (и в продакшене задан EMAIL_FROM). */
      emailDeliveryEnabled: boolean;
      /**
       * Пользователь найден, но письмо не ушло (ошибка SMTP/API / сеть).
       * Показываем отдельное предупреждение (теоретически даёт намёк на существование аккаунта только при сбое доставки).
       */
      sendFailedForKnownUser?: boolean;
    };

export async function requestPasswordResetAction(raw: unknown): Promise<RequestPasswordResetResult> {
  const hasMailTransport =
    Boolean(process.env.SMTP_HOST?.trim()) || Boolean(process.env.RESEND_API_KEY?.trim());
  const hasEmailFrom = Boolean(process.env.EMAIL_FROM?.trim());
  const emailDeliveryEnabled =
    hasMailTransport && (process.env.NODE_ENV !== "production" || hasEmailFrom);

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректный email" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) {
    return { ok: true, emailDeliveryEnabled };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });
  });

  const resetUrl = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const sendResult = await sendPasswordResetEmail(user.email, resetUrl);
  if (!sendResult.sent) {
    const hint =
      sendResult.reason === "NOT_CONFIGURED"
        ? "нет SMTP_HOST и RESEND_API_KEY"
        : sendResult.reason === "MISSING_EMAIL_FROM"
          ? "нет EMAIL_FROM в production"
          : sendResult.reason === "PROVIDER_ERROR"
            ? (sendResult.detail ?? "ошибка провайдера почты")
            : "сеть";
    console.error(
      `[password-reset] Письмо не ушло (${hint}). Проверьте SMTP_* или RESEND_API_KEY, EMAIL_FROM, SPF/DKIM. NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL влияют на ссылку в письме.`,
    );
    return {
      ok: true,
      emailDeliveryEnabled,
      sendFailedForKnownUser: true,
    };
  }

  return { ok: true, emailDeliveryEnabled };
}

export async function resetPasswordWithTokenAction(raw: unknown): Promise<PasswordResetResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { token, password } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({ where: { token } });
      if (!row || row.expiresAt < new Date()) {
        throw new Error("INVALID_TOKEN");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: row.userId } });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_TOKEN") {
      return { ok: false, error: "Ссылка недействительна или устарела. Запросите новую." };
    }
    throw e;
  }

  return { ok: true };
}
