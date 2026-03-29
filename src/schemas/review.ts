import { z } from "zod";

export const createReviewSchema = z.object({
  orderId: z.string().min(1),
  toUserId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: z
    .string()
    .max(2000)
    .optional()
    .transform((s) => {
      const t = s?.trim() ?? "";
      return t.length === 0 ? undefined : t.slice(0, 2000);
    }),
});
