"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { writeAuditLog } from "@/server/audit/log";
import {
  adminCategoryIdSchema,
  adminCreateCategorySchema,
  adminCreateSubcategorySchema,
  adminSubcategoryIdSchema,
  adminUpdateCategorySchema,
  adminUpdateSubcategorySchema,
} from "@/schemas/category";
import type { ActionResult } from "@/server/actions/orders/create-order";

async function requireAdmin() {
  const u = await getSessionUserForAction();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/customer/orders/new");
  revalidatePath("/admin/audit-logs");
}

export async function adminCreateCategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminCreateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  try {
    const row = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await writeAuditLog({
      actorUserId: admin.id,
      action: "CATEGORY_CREATE",
      entityType: "Category",
      entityId: row.id,
      newValue: { name: row.name, slug: row.slug, sortOrder: row.sortOrder },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Категория с таким slug уже есть" };
    }
    throw e;
  }

  revalidateCategoryPaths();
  return { ok: true };
}

export async function adminUpdateCategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminUpdateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const prev = await prisma.category.findUnique({ where: { id: parsed.data.id } });
  if (!prev) return { ok: false, error: "Категория не найдена" };

  try {
    await prisma.category.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await writeAuditLog({
      actorUserId: admin.id,
      action: "CATEGORY_UPDATE",
      entityType: "Category",
      entityId: parsed.data.id,
      oldValue: { name: prev.name, slug: prev.slug, sortOrder: prev.sortOrder },
      newValue: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Категория с таким slug уже есть" };
    }
    throw e;
  }

  revalidateCategoryPaths();
  return { ok: true };
}

export async function adminDeleteCategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminCategoryIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const cat = await prisma.category.findUnique({ where: { id: parsed.data.id } });
  if (!cat) return { ok: false, error: "Категория не найдена" };

  const orders = await prisma.order.count({ where: { categoryId: parsed.data.id } });
  if (orders > 0) {
    return { ok: false, error: "Нельзя удалить категорию с привязанными заказами" };
  }

  await prisma.$transaction([
    prisma.subcategory.deleteMany({ where: { categoryId: parsed.data.id } }),
    prisma.category.delete({ where: { id: parsed.data.id } }),
  ]);

  await writeAuditLog({
    actorUserId: admin.id,
    action: "CATEGORY_DELETE",
    entityType: "Category",
    entityId: cat.id,
    oldValue: { name: cat.name, slug: cat.slug },
  });

  revalidateCategoryPaths();
  return { ok: true };
}

export async function adminCreateSubcategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminCreateSubcategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!cat) return { ok: false, error: "Категория не найдена" };

  try {
    const row = await prisma.subcategory.create({
      data: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await writeAuditLog({
      actorUserId: admin.id,
      action: "SUBCATEGORY_CREATE",
      entityType: "Subcategory",
      entityId: row.id,
      newValue: {
        categoryId: row.categoryId,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sortOrder,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "В этой категории уже есть подкатегория с таким slug" };
    }
    throw e;
  }

  revalidateCategoryPaths();
  return { ok: true };
}

export async function adminUpdateSubcategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminUpdateSubcategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const sub = await prisma.subcategory.findUnique({ where: { id: parsed.data.id } });
  if (!sub) return { ok: false, error: "Подкатегория не найдена" };

  const prev = { name: sub.name, slug: sub.slug, sortOrder: sub.sortOrder, categoryId: sub.categoryId };

  try {
    await prisma.subcategory.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await writeAuditLog({
      actorUserId: admin.id,
      action: "SUBCATEGORY_UPDATE",
      entityType: "Subcategory",
      entityId: parsed.data.id,
      oldValue: prev,
      newValue: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
        categoryId: sub.categoryId,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "В этой категории уже есть подкатегория с таким slug" };
    }
    throw e;
  }

  revalidateCategoryPaths();
  return { ok: true };
}

export async function adminDeleteSubcategoryAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Нет доступа" };

  const parsed = adminSubcategoryIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const sub = await prisma.subcategory.findUnique({ where: { id: parsed.data.id } });
  if (!sub) return { ok: false, error: "Подкатегория не найдена" };

  const orders = await prisma.order.count({ where: { subcategoryId: parsed.data.id } });
  if (orders > 0) {
    return { ok: false, error: "Нельзя удалить подкатегорию с привязанными заказами" };
  }

  await prisma.subcategory.delete({ where: { id: parsed.data.id } });

  await writeAuditLog({
    actorUserId: admin.id,
    action: "SUBCATEGORY_DELETE",
    entityType: "Subcategory",
    entityId: sub.id,
    oldValue: { name: sub.name, slug: sub.slug, categoryId: sub.categoryId },
  });

  revalidateCategoryPaths();
  return { ok: true };
}
