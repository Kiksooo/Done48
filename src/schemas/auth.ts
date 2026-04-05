import { z } from "zod";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";

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

/** Подсказка под успехом: доставка и спам. */
export const PASSWORD_RESET_DELIVERY_HINT =
  "Обычно письмо приходит за 1–3 минуты. Проверьте папку «Спам» и промоакции. Адрес в письме должен совпадать с тем, что вы ввели.";

/** Не задан транспорт почты (SMTP_HOST или RESEND_API_KEY) или в продакшене нет EMAIL_FROM. */
export const PASSWORD_RESET_MAIL_DISABLED_WARNING =
  "Отправка писем с сайта сейчас не настроена: задайте SMTP (SMTP_HOST и при необходимости логин/пароль) или RESEND_API_KEY; в продакшене обязателен EMAIL_FROM. Ссылка для сброса по email недоступна — обратитесь в поддержку или к администратору площадки.";

/** Ошибка SMTP/API или сеть — письмо не отправлено (аккаунт при этом мог существовать). */
export const PASSWORD_RESET_SEND_FAILED_WARNING = `Отправить письмо сейчас не удалось (ошибка почтового сервиса или сети). Попробуйте через несколько минут. Если не поможет — напишите на ${SITE_EMAIL_INFO}, указав email, на который запрашивали сброс.`;

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
