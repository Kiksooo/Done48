import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertOrderReadable } from "@/server/orders/access";

export async function ensureChatMembership(params: {
  orderId: string;
  userId: string;
  role: Role;
  customerId: string;
  executorId: string | null;
}) {
  const access = await assertOrderReadable({
    orderId: params.orderId,
    userId: params.userId,
    role: params.role,
  });
  if (!access.ok) return { ok: false as const };

  const chat = await prisma.chat.findUnique({ where: { orderId: params.orderId } });
  if (!chat) return { ok: false as const };

  const canJoin =
    params.role === "ADMIN" ||
    params.userId === params.customerId ||
    params.userId === params.executorId;

  if (!canJoin) {
    return { ok: true as const, chatId: chat.id, member: false as const };
  }

  await prisma.chatMember.upsert({
    where: { chatId_userId: { chatId: chat.id, userId: params.userId } },
    create: { chatId: chat.id, userId: params.userId },
    update: {},
  });

  return { ok: true as const, chatId: chat.id, member: true as const };
}

export async function getChatMessagesForOrder(orderId: string) {
  const chat = await prisma.chat.findUnique({
    where: { orderId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, email: true } },
        },
      },
      members: {
        select: { userId: true, lastReadAt: true },
      },
    },
  });
  return chat;
}
