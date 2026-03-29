import { DisputeStatus } from "@prisma/client";
import { z } from "zod";

const cuid = z.string().min(1);

export const openDisputeSchema = z.object({
  orderId: cuid,
  reason: z.string().trim().min(10, "Опишите суть спора (от 10 символов)").max(8000),
});

export const adminUpdateDisputeSchema = z.object({
  disputeId: cuid,
  status: z.nativeEnum(DisputeStatus),
  resolution: z.string().trim().max(8000).optional().nullable(),
});
