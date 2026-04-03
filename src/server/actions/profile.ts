"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { isContactBlocklisted } from "@/lib/contact-blocklist";
import { writeAuditLog } from "@/server/audit/log";
import { customerProfileUpdateSchema, executorProfileUpdateSchema } from "@/schemas/profile";
import type { ActionResult } from "@/server/actions/orders/create-order";

export async function updateCustomerProfileAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = customerProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const d = parsed.data;
  if (d.phone && (await isContactBlocklisted("PHONE", d.phone))) {
    return { ok: false, error: "Этот номер телефона в списке ограничений площадки" };
  }
  if (d.telegram && (await isContactBlocklisted("TELEGRAM", d.telegram))) {
    return { ok: false, error: "Этот контакт Telegram в списке ограничений площадки" };
  }

  await prisma.customerProfile.update({
    where: { userId: user.id },
    data: {
      displayName: d.displayName,
      phone: d.phone,
      telegram: d.telegram,
      company: d.company,
      city: d.city,
      avatarUrl: d.avatarUrl,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "PROFILE_UPDATE",
    entityType: "CustomerProfile",
    entityId: user.id,
    newValue: { role: "CUSTOMER" },
  });

  revalidatePath("/customer/profile");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}

export async function updateExecutorProfileAction(raw: unknown): Promise<ActionResult> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return { ok: false, error: "Нет доступа" };
  }

  const parsed = executorProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const d = parsed.data;

  if (d.phone && (await isContactBlocklisted("PHONE", d.phone))) {
    return { ok: false, error: "Этот номер телефона в списке ограничений площадки" };
  }
  if (d.telegram && (await isContactBlocklisted("TELEGRAM", d.telegram))) {
    return { ok: false, error: "Этот контакт Telegram в списке ограничений площадки" };
  }

  const prevProfile = await prisma.executorProfile.findUnique({
    where: { userId: user.id },
    select: { username: true },
  });

  try {
    await prisma.executorProfile.update({
      where: { userId: user.id },
      data: {
        displayName: d.displayName,
        username: d.username,
        phone: d.phone,
        telegram: d.telegram,
        city: d.city,
        orderCities: d.orderCities,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Этот username уже занят" };
    }
    throw e;
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "PROFILE_UPDATE",
    entityType: "ExecutorProfile",
    entityId: user.id,
    newValue: { role: "EXECUTOR", username: d.username },
  });

  revalidatePath("/executor/profile");
  revalidatePath("/executor/orders/available");
  revalidatePath("/executors");
  revalidatePath("/admin/audit-logs");
  if (prevProfile?.username) {
    revalidatePath(`/u/${prevProfile.username}`);
  }
  if (d.username && d.username !== prevProfile?.username) {
    revalidatePath(`/u/${d.username}`);
  }

  return { ok: true };
}
