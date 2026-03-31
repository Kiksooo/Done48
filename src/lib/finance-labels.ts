import type { PayoutStatus, TransactionType } from "@prisma/client";

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
  PAID: "Выплачена",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  TOPUP: "Пополнение",
  RESERVE: "Блокировка в безопасной сделке",
  CAPTURE: "Списание (заказ)",
  REFUND: "Возврат",
  PAYOUT: "Выплата",
  WITHDRAWAL: "Вывод средств",
  ADJUSTMENT: "Корректировка",
  FEE: "Комиссия платформы",
};
