import { z } from "zod";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export const blogPostSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен").max(300),
  slug: z
    .string()
    .min(1, "Slug обязателен")
    .max(200)
    .transform((s) => slugify(s)),
  excerpt: z.string().max(1000).optional().default(""),
  content: z.string().min(1, "Содержание обязательно"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
