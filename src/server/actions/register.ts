"use server";

import bcrypt from "bcryptjs";
import { NotificationKind, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isContactBlocklisted } from "@/lib/contact-blocklist";
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
  const refRaw = formData.get("ref");
  const referralUserId = typeof refRaw === "string" && refRaw.trim().length > 0 ? refRaw.trim() : null;
  let blocked = false;
  try {
    blocked = await isContactBlocklisted("EMAIL", email);
  } catch {
    // Если таблица блок-листа недоступна, не валим регистрацию целиком.
    blocked = false;
  }
  if (blocked) {
    return {
      ok: false,
      error: "Регистрация с этого адреса недоступна. Свяжитесь с поддержкой, если это ошибка.",
    };
  }
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { ok: false, error: "Пользователь с таким email уже есть" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const role = parsed.data.role as Role;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        onboardingDone: false,
      },
    });

    // Профиль полезен, но его ошибка не должна блокировать регистрацию аккаунта.
    try {
      if (role === Role.CUSTOMER) {
        await prisma.customerProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, displayName: email.split("@")[0] },
        });
      } else {
        await prisma.executorProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, displayName: email.split("@")[0] },
        });
      }
    } catch (profileError) {
      if (
        profileError instanceof Prisma.PrismaClientKnownRequestError &&
        (profileError.code === "P2021" || profileError.code === "P2022")
      ) {
        return { ok: true };
      }
      throw profileError;
    }

    if (referralUserId && referralUserId !== user.id) {
      try {
        const inviter = await prisma.user.findUnique({
          where: { id: referralUserId },
          select: { id: true },
        });
        if (inviter) {
          await prisma.notification.create({
            data: {
              userId: inviter.id,
              kind: NotificationKind.GENERIC,
              title: "Новая регистрация по вашей ссылке",
              body: `${email} зарегистрировался(ась) по вашей реферальной ссылке.`,
              link: "/",
            },
          });
        }
      } catch {
        // Ошибки реферального уведомления не должны блокировать регистрацию.
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("[register] failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Пользователь с таким email уже есть" };
    }
    return {
      ok: false,
      error: "Не удалось создать аккаунт. Попробуйте ещё раз через пару минут.",
    };
  }
}
