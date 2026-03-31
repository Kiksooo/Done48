import { z } from "zod";

export const demoTopUpSchema = z.object({
  rubles: z.coerce.number().positive("Сумма должна быть больше 0").max(10_000_000),
});

export const demoWithdrawSchema = z.object({
  rubles: z.coerce.number().positive("Сумма должна быть больше 0").max(10_000_000),
});

export const reserveOrderSchema = z.object({
  orderId: z.string().min(1),
});

export const payoutRequestSchema = z.object({
  amountRubles: z.coerce.number().positive("Укажите сумму").max(10_000_000),
  payoutDetails: z.string().trim().min(5, "Укажите реквизиты").max(4000),
});

export const adminPayoutActionSchema = z.object({
  payoutId: z.string().min(1),
  adminNote: z.string().trim().max(2000).optional(),
});
