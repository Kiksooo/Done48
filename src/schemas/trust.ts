import { ContactBlocklistKind, UserReportCategory, UserReportStatus } from "@prisma/client";
import { z } from "zod";

const cuid = z.string().min(1);

export const submitUserReportSchema = z.object({
  orderId: cuid,
  category: z.nativeEnum(UserReportCategory),
  description: z.string().trim().min(20, "Опишите ситуацию хотя бы в нескольких предложениях").max(8000),
});

export const adminUpdateUserReportSchema = z.object({
  reportId: cuid,
  status: z.nativeEnum(UserReportStatus),
  adminNote: z.string().trim().max(4000).optional().nullable(),
});

export const adminAddBlocklistSchema = z.object({
  kind: z.nativeEnum(ContactBlocklistKind),
  value: z.string().trim().min(2, "Слишком коротко").max(500),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const adminRemoveBlocklistSchema = z.object({
  entryId: cuid,
});

export const adminSetUserActiveSchema = z.object({
  userId: cuid,
  isActive: z.boolean(),
});
