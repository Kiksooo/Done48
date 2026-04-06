import { z } from "zod";

const cuid = z.string().min(1);

export const adminDeleteUserSchema = z.object({
  userId: cuid,
});

/** Смена роли только между заказчиком и специалистом (не админ). */
export const adminSetUserRoleSchema = z.object({
  userId: cuid,
  role: z.enum(["CUSTOMER", "EXECUTOR"]),
});
