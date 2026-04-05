import { z } from "zod";

export const addOrderCustomerPartnerSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().trim().email("Некорректный email"),
});

export const removeOrderCustomerPartnerSchema = z.object({
  orderId: z.string().min(1),
  partnerUserId: z.string().min(1),
});
