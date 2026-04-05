import { z } from "zod";

const cuid = z.string().min(1);

export const adminApprovePortfolioItemSchema = z.object({
  itemId: cuid,
});

export const adminRejectPortfolioItemSchema = z.object({
  itemId: cuid,
  note: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z
      .string()
      .max(2000)
      .transform((s) => {
        const t = s.trim();
        return t.length === 0 ? null : t;
      }),
  ),
});
