"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/schemas/auth";

export type RegisterState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerUser(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      error: "Проверьте поля формы",
      fieldErrors: fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { ok: false, error: "Пользователь с таким email уже есть" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const role = parsed.data.role as Role;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role,
        onboardingDone: false,
      },
    });

    if (role === Role.CUSTOMER) {
      await tx.customerProfile.create({
        data: { userId: user.id, displayName: email.split("@")[0] },
      });
    } else {
      await tx.executorProfile.create({
        data: { userId: user.id, displayName: email.split("@")[0] },
      });
    }
  });

  return { ok: true };
}
