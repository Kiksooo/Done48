import type { Role } from "@prisma/client";

/** Показать email участника заказа на телефонном экране карточки и т.п. */
export function canRevealOrderPartyEmail(params: {
  viewerRole: Role;
  viewerId: string;
  partyUserId: string | null | undefined;
  customerId: string;
  executorId: string | null;
}): boolean {
  if (!params.partyUserId) return false;
  const { viewerRole, viewerId, partyUserId, customerId, executorId } = params;
  if (viewerRole === "ADMIN") return true;
  if (viewerId === partyUserId) return true;
  if (viewerId === customerId && executorId !== null && partyUserId === executorId) return true;
  if (viewerId === executorId && partyUserId === customerId) return true;
  return false;
}

/** Подпись отправителя в чате без раскрытия email */
export function orderChatMessageSenderLine(params: {
  viewerRole: Role;
  viewerId: string;
  customerId: string;
  executorId: string | null;
  senderId: string | null;
  senderEmail: string | null;
}): string {
  if (params.viewerRole === "ADMIN" && params.senderEmail) {
    return params.senderEmail;
  }
  if (!params.senderId) {
    return "Система";
  }
  if (params.senderId === params.viewerId) {
    return "Вы";
  }
  if (params.senderId === params.customerId) {
    return "Заказчик";
  }
  if (params.executorId && params.senderId === params.executorId) {
    return "Исполнитель";
  }
  return "Участник";
}
