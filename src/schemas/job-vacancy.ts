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

export const jobVacancySchema = z.object({
  title: z.string().min(1, "Заголовок обязателен").max(300),
  slug: z
    .string()
    .min(1, "Slug обязателен")
    .max(200)
    .transform((s) => slugify(s)),
  summary: z.string().max(2000).optional().default(""),
  description: z.string().min(1, "Описание вакансии обязательно").max(50000),
  employmentType: z.string().max(120).optional().default(""),
  location: z.string().max(200).optional().default(""),
  salaryHint: z.string().max(200).optional().default(""),
  published: z.boolean().default(false),
  acceptingApplications: z.boolean().default(true),
});

export type JobVacancyInput = z.infer<typeof jobVacancySchema>;
