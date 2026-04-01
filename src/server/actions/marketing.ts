"use server";

import { revalidatePath } from "next/cache";
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

  if (user.role === "CUSTOMER") revalidatePath("/customer/profile");
  if (user.role === "EXECUTOR") revalidatePath("/executor/profile");
  return { ok: true };
}
