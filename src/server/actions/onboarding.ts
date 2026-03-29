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

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingDone: true },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
