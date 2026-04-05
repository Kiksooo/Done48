import type { Role } from "@prisma/client";

/** Показать email участника заказа на телефонном экране карточки и т.п. */
export function canRevealOrderPartyEmail(params: {
  viewerRole: Role;
  viewerId: string;
  partyUserId: string | null | undefined;
  customerId: string;
  executorId: string | null;
  /** Соучастники заказчика (доп. заказчики). */
  customerPartnerUserIds?: string[];
}): boolean {
  if (!params.partyUserId) return false;
  const { viewerRole, viewerId, partyUserId, customerId, executorId } = params;
  const partners = params.customerPartnerUserIds ?? [];
  const viewerOnCustomerSide = viewerId === customerId || partners.includes(viewerId);
  const partyIsCustomerSide = partyUserId === customerId || partners.includes(partyUserId);
  if (viewerRole === "ADMIN") return true;
  if (viewerId === partyUserId) return true;
  if (viewerOnCustomerSide && executorId !== null && partyUserId === executorId) return true;
  if (viewerId === executorId && partyIsCustomerSide) return true;
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
  customerPartnerUserIds?: string[];
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
  const partners = params.customerPartnerUserIds ?? [];
  const senderIsCustomerSide =
    params.senderId === params.customerId || partners.includes(params.senderId);
  if (senderIsCustomerSide) {
    return "Заказчик";
  }
  if (params.executorId && params.senderId === params.executorId) {
    return "Исполнитель";
  }
  return "Участник";
}
