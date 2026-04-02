"use server";

import { revalidatePath } from "next/cache";
import { syncMailerLiteSubscriber } from "@/lib/mailerlite";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/server/actions/orders/create-order";

export async function setMarketingOptInAction(enabled: boolean): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user) return { ok: false, error: "Нужна авторизация" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      marketingOptIn: enabled,
      marketingOptInAt: enabled ? new Date() : null,
    },
  });

  const email = user.email.trim();
  if (email) {
    const [cust, exec] = await Promise.all([
      prisma.customerProfile.findUnique({
        where: { userId: user.id },
        select: { displayName: true },
      }),
      prisma.executorProfile.findUnique({
        where: { userId: user.id },
        select: { displayName: true },
      }),
    ]);
    const name = exec?.displayName ?? cust?.displayName ?? null;
    void syncMailerLiteSubscriber({ email, subscribed: enabled, name });
  }

  if (user.role === "CUSTOMER") revalidatePath("/customer/profile");
  if (user.role === "EXECUTOR") revalidatePath("/executor/profile");
  return { ok: true };
}
