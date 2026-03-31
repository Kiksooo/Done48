import { z } from "zod";

export const submitFeedbackSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email("Некорректный email").optional(),
    message: z.string().trim().min(20, "Опишите подробнее (минимум 20 символов)").max(4000),
  })
  .strict();

