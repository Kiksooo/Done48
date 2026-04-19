"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";

export type OnboardingState = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(): Promise<OnboardingState> {
  const user = await getSessionUserForAction();
  if (!user) {
    return { ok: false, error: "Нужна авторизация" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingDone: true },
    });
  } catch (e) {
    console.error("[onboarding] complete failed", e);
    return { ok: false, error: "Не удалось завершить онбординг. Попробуйте ещё раз." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
