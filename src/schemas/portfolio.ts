import { z } from "zod";

const cuid = z.string().min(1);

function optionalHttpUrl(field: string) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().max(2000),
  )
    .transform((s) => s.trim())
    .transform((s) => (s === "" ? null : s))
    .refine((s) => s === null || /^https?:\/\//i.test(s), {
      message: `${field}: разрешены только http(s) ссылки`,
    });
}

/** Как аватар: загрузка даёт `/uploads/…` или внешний https. */
const portfolioImageUrlField = z
  .string()
  .max(2048)
  .transform((s) => s.trim())
  .refine(
    (s) => s.length === 0 || s.startsWith("/uploads/") || /^https?:\/\//i.test(s),
    "Фото: укажите https:// ссылку или загрузите файл",
  )
  .transform((s) => (s.length === 0 ? null : s.slice(0, 2048)));

const portfolioBodySchema = z.object({
  title: z.string().trim().min(1, "Название").max(200),
  description: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().max(5000),
  ).transform((s) => {
    const t = s.trim();
    return t.length === 0 ? null : t;
  }),
  imageUrl: portfolioImageUrlField,
  linkUrl: optionalHttpUrl("Ссылка на работу"),
});

export const portfolioCreateSchema = portfolioBodySchema.refine((d) => d.imageUrl != null, {
  message: "Нужно фото работы",
  path: ["imageUrl"],
});

export const portfolioUpdateSchema = portfolioBodySchema
  .extend({
    id: cuid,
  })
  .refine((d) => d.imageUrl != null, {
    message: "Нужно фото работы",
    path: ["imageUrl"],
  });

export const portfolioDeleteSchema = z.object({
  id: cuid,
});
