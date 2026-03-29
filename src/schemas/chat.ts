import { z } from "zod";

export const sendChatMessageSchema = z.object({
  orderId: z.string().min(1),
  body: z.string().trim().min(1, "Введите сообщение").max(5000),
  attachmentUrl: z.string().max(2000).optional().nullable(),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
