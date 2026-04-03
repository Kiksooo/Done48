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
    /** HTML checkbox: при отмеченном поле приходит `"on"` */
    acceptTerms: z.union([z.literal("on"), z.literal("true")]).optional(),
    marketingOptIn: z.union([z.literal("on"), z.undefined()]).optional(),
  })
  .strict()
  .refine((d) => d.acceptTerms === "on" || d.acceptTerms === "true", {
    message: "Подтвердите согласие с пользовательским соглашением и политикой конфиденциальности",
    path: ["acceptTerms"],
  });

/** Текст после запроса сброса (не раскрывает, есть ли аккаунт). */
export const PASSWORD_RESET_REQUEST_SUCCESS =
  "Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля.";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Некорректный email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Недействительная ссылка"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(128, "Слишком длинный пароль"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
