"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type OnboardingState = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(): Promise<OnboardingState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Нужна авторизация" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDone: true },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
