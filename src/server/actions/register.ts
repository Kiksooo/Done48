"use server";

import bcrypt from "bcryptjs";
import {
  ExecutorAccountStatus,
  NotificationKind,
  Prisma,
  Role,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { isContactBlocklisted } from "@/lib/contact-blocklist";
import { syncMailerLiteSubscriber } from "@/lib/mailerlite";
import { REFERRAL_REWARD_CENTS } from "@/lib/referral";
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
    acceptTerms: formData.get("acceptTerms") ?? undefined,
    marketingOptIn: formData.get("marketingOptIn") ?? undefined,
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

    const marketingOn = parsed.data.marketingOptIn === "on";
    const pushMailerLiteSignup = () => {
      if (!marketingOn) return;
      void syncMailerLiteSubscriber({
        email,
        subscribed: true,
        name: email.split("@")[0],
      });
    };

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        onboardingDone: false,
        marketingOptIn: marketingOn,
        marketingOptInAt: marketingOn ? new Date() : null,
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
          update: { accountStatus: ExecutorAccountStatus.ACTIVE },
          create: {
            userId: user.id,
            displayName: email.split("@")[0],
            accountStatus: ExecutorAccountStatus.ACTIVE,
          },
        });
      }
    } catch (profileError) {
      if (
        profileError instanceof Prisma.PrismaClientKnownRequestError &&
        (profileError.code === "P2021" || profileError.code === "P2022")
      ) {
        pushMailerLiteSignup();
        return { ok: true };
      }
      throw profileError;
    }

    if (referralUserId && referralUserId !== user.id) {
      try {
        await prisma.$transaction(async (tx) => {
          const inviter = await tx.user.findUnique({
            where: { id: referralUserId },
            select: { id: true, role: true },
          });
          if (!inviter) return;

          const payBonus =
            inviter.role === Role.CUSTOMER || inviter.role === Role.EXECUTOR;

          if (payBonus) {
            try {
              await tx.referralSignup.create({
                data: {
                  referrerId: inviter.id,
                  referredUserId: user.id,
                  rewardCents: REFERRAL_REWARD_CENTS,
                },
              });
            } catch (e) {
              if (
                e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === "P2002"
              ) {
                return;
              }
              throw e;
            }

            if (inviter.role === Role.CUSTOMER) {
              const up = await tx.customerProfile.updateMany({
                where: { userId: inviter.id },
                data: { balanceCents: { increment: REFERRAL_REWARD_CENTS } },
              });
              if (up.count !== 1) throw new Error("REFERRAL_PROFILE");
            } else {
              const up = await tx.executorProfile.updateMany({
                where: { userId: inviter.id },
                data: { balanceCents: { increment: REFERRAL_REWARD_CENTS } },
              });
              if (up.count !== 1) throw new Error("REFERRAL_PROFILE");
            }

            await tx.transaction.create({
              data: {
                type: TransactionType.REFERRAL_BONUS,
                amountCents: REFERRAL_REWARD_CENTS,
                currency: "RUB",
                toUserId: inviter.id,
                meta: { referredUserId: user.id },
              },
            });
          }

          await tx.notification.create({
            data: {
              userId: inviter.id,
              kind: NotificationKind.GENERIC,
              title: "Новая регистрация по вашей ссылке",
              body: `${email} зарегистрировался(ась) по вашей реферальной ссылке.`,
              link: "/",
            },
          });
        });
      } catch {
        // Ошибки реферального блока не отменяют уже созданный аккаунт.
      }
    }

    pushMailerLiteSignup();
    return { ok: true };
  } catch (error) {
    console.error("[register] failed:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { ok: false, error: "Пользователь с таким email уже есть" };
      }
      if (error.code === "P2022") {
        return {
          ok: false,
          error:
            "База данных устарела относительно кода: выполните на сервере npx prisma migrate deploy и повторите регистрацию.",
        };
      }
      if (error.code === "P1001") {
        return {
          ok: false,
          error: "Не удаётся подключиться к базе данных. Попробуйте позже или напишите в поддержку.",
        };
      }
    }
    const msg = error instanceof Error ? error.message : "";
    if (
      /marketingOptIn|column .+ does not exist|does not exist in the current database/i.test(msg)
    ) {
      return {
        ok: false,
        error:
          "База данных устарела относительно кода: выполните на сервере npx prisma migrate deploy и повторите регистрацию.",
      };
    }
    return {
      ok: false,
      error: "Не удалось создать аккаунт. Попробуйте ещё раз через пару минут.",
    };
  }
}
