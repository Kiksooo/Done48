import type { TransactionType } from "@prisma/client";

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  TOPUP: "Пополнение",
  RESERVE: "Резерв под заказ",
  CAPTURE: "Списание (заказ)",
  REFUND: "Возврат",
  PAYOUT: "Выплата",
  ADJUSTMENT: "Корректировка",
  FEE: "Комиссия платформы",
};
