import {
  BudgetType,
  OrderStatus,
  VisibilityType,
} from "@prisma/client";
import { z } from "zod";

const cuid = z.string().min(1);

export const createOrderSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(200),
  description: z.string().trim().min(10, "Опишите задачу подробнее").max(20000),
  categoryId: cuid,
  subcategoryId: z.union([cuid, z.literal("")]).optional(),
    budgetRubles: z.number().positive("Бюджет должен быть больше 0"),
  budgetType: z.nativeEnum(BudgetType),
  deadlineAt: z.string().optional(),
  urgency: z.boolean(),
  visibilityType: z.nativeEnum(VisibilityType),
  executorRequirements: z.string().trim().max(5000).optional().nullable(),
  initialStatus: z.enum(["NEW", "ON_MODERATION"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const adminSetOrderStatusSchema = z.object({
  orderId: cuid,
  status: z.nativeEnum(OrderStatus),
  note: z.string().trim().max(2000).optional(),
});

export const adminAssignExecutorSchema = z.object({
  orderId: cuid,
  executorUserId: cuid,
});

export const adminAcceptProposalSchema = z.object({
  proposalId: cuid,
});

export const createProposalSchema = z.object({
  orderId: cuid,
  offeredRubles: z.coerce.number().positive().optional(),
  offeredDays: z.coerce.number().int().positive().optional(),
  message: z.string().trim().max(4000).optional(),
});

export const customerOrderActionSchema = z.object({
  orderId: cuid,
});
