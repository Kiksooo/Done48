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

export const portfolioCreateSchema = z.object({
  title: z.string().trim().min(1, "Название").max(200),
  description: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().max(5000),
  ).transform((s) => {
    const t = s.trim();
    return t.length === 0 ? null : t;
  }),
  imageUrl: optionalHttpUrl("Изображение"),
  linkUrl: optionalHttpUrl("Ссылка на работу"),
});

export const portfolioUpdateSchema = portfolioCreateSchema.extend({
  id: cuid,
});

export const portfolioDeleteSchema = z.object({
  id: cuid,
});
