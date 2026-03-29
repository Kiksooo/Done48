import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1, "Slug обязателен")
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы");

const cuid = z.string().min(1);

export const adminCreateCategorySchema = z.object({
  name: z.string().trim().min(1, "Название").max(120),
  slug,
  sortOrder: z.coerce.number().int().catch(0),
});

export const adminUpdateCategorySchema = z.object({
  id: cuid,
  name: z.string().trim().min(1).max(120),
  slug,
  sortOrder: z.coerce.number().int(),
});

export const adminCreateSubcategorySchema = z.object({
  categoryId: cuid,
  name: z.string().trim().min(1).max(120),
  slug,
  sortOrder: z.coerce.number().int().catch(0),
});

export const adminUpdateSubcategorySchema = z.object({
  id: cuid,
  name: z.string().trim().min(1).max(120),
  slug,
  sortOrder: z.coerce.number().int(),
});

export const adminCategoryIdSchema = z.object({ id: cuid });
export const adminSubcategoryIdSchema = z.object({ id: cuid });
