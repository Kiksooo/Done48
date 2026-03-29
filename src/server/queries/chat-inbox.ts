import { prisma } from "@/lib/db";

export type ChatInboxRow = {
  orderId: string;
  orderTitle: string;
  orderStatus: string;
  lastPreview: string;
  lastAt: Date;
  unreadCount: number;
};

/**
 * Чаты, где пользователь состоит в ChatMember (заказчик / исполнитель / добавленный админом).
 */
export async function listChatsForInbox(userId: string): Promise<ChatInboxRow[]> {
  const members = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          order: {
            select: {
              id: true,
              title: true,
              status: true,
              updatedAt: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, kind: true },
          },
        },
      },
    },
  });

  const rows: ChatInboxRow[] = [];

  for (const m of members) {
    const order = m.chat.order;
    const last = m.chat.messages[0];
    const lastReadAt = m.lastReadAt;

    const unreadCount = await prisma.chatMessage.count({
      where: {
        chatId: m.chatId,
        createdAt: { gt: lastReadAt ?? new Date(0) },
        NOT: {
          kind: "USER",
          senderId: userId,
        },
      },
    });

    const lastPreview = last
      ? last.kind === "SYSTEM"
        ? last.body.slice(0, 120)
        : last.body.slice(0, 120)
      : "Нет сообщений";

    rows.push({
      orderId: order.id,
      orderTitle: order.title,
      orderStatus: order.status,
      lastPreview,
      lastAt: last?.createdAt ?? order.updatedAt,
      unreadCount,
    });
  }

  rows.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  return rows;
}
