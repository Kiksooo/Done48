import { ExecutorAccountStatus } from "@prisma/client";
import { z } from "zod";

const cuid = z.string().min(1);

export const adminSetExecutorAccountStatusSchema = z.object({
  userId: cuid,
  status: z.nativeEnum(ExecutorAccountStatus),
});
