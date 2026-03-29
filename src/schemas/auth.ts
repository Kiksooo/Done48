import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z
  .object({
    email: z.string().trim().email("Некорректный email"),
    password: z
      .string()
      .min(8, "Минимум 8 символов")
      .max(128, "Слишком длинный пароль"),
    role: z.enum(["CUSTOMER", "EXECUTOR"], {
      message: "Выберите роль",
    }),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
