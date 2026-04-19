import { ChatMessageKind } from "@prisma/client";
import { prisma } from "@/lib/db";

const MAX_SYSTEM_BODY = 8000;

/**
 * Добавляет системное сообщение в чат заказа (не ломает основной сценарий при ошибке).
 */
export async function appendOrderSystemChatMessage(orderId: string, body: string): Promise<void> {
  const text = body.trim().slice(0, MAX_SYSTEM_BODY);
  if (!text) return;

  try {
    const chat = await prisma.chat.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (!chat) return;

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        kind: ChatMessageKind.SYSTEM,
        body: text,
        senderId: null,
      },
    });
  } catch (e) {
    console.error("[order-system-chat] append failed", orderId, e);
  }
}
