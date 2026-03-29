import { z } from "zod";

export const adminUpdatePlatformSettingsSchema = z.object({
  platformFeePercent: z.coerce.number().min(0, "Минимум 0").max(100, "Максимум 100"),
  minPayoutRubles: z.coerce.number().min(0, "Минимум 0").max(1_000_000),
});
