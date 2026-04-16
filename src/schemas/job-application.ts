import { z } from "zod";

export const jobApplicationPublicSchema = z.object({
  fullName: z.string().min(2, "Укажите имя").max(120),
  email: z.string().email("Некорректный email").max(254),
  phone: z.string().max(40).optional().default(""),
  coverLetter: z.string().min(20, "Расскажите о себе хотя бы в паре предложений").max(8000),
  resumeUrl: z.string().url().optional().or(z.literal("")),
});

export type JobApplicationPublicInput = z.infer<typeof jobApplicationPublicSchema>;
