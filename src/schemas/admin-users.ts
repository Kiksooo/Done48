import { z } from "zod";

const cuid = z.string().min(1);

export const adminDeleteUserSchema = z.object({
  userId: cuid,
});
