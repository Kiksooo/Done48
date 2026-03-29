"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { appBaseUrl } from "@/lib/site-url";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export type PasswordResetResult = { ok: true } | { ok: false; error: string };

export async function requestPasswordResetAction(raw: unknown): Promise<PasswordResetResult> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректный email" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) {
    return { ok: true };
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
  await sendPasswordResetEmail(user.email, resetUrl);

  return { ok: true };
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
