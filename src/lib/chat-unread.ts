import type { ChatMessage } from "@prisma/client";

type Msg = Pick<ChatMessage, "createdAt" | "senderId" | "kind">;

/** Сообщения после lastReadAt, кроме собственных USER. */
export function countUnreadChatMessages(
  messages: Msg[],
  viewerId: string,
  lastReadAt: Date | null,
): number {
  const threshold = lastReadAt?.getTime() ?? 0;
  return messages.filter((m) => {
    if (m.createdAt.getTime() <= threshold) return false;
    if (m.kind === "USER" && m.senderId === viewerId) return false;
    return true;
  }).length;
}
