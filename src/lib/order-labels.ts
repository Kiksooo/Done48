import type {
  BudgetType,
  OrderStatus,
  PaymentStatus,
  VisibilityType,
} from "@prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Черновик",
  NEW: "Новый",
  ON_MODERATION: "На модерации",
  PUBLISHED: "Опубликован",
  ASSIGNED: "Назначен",
  IN_PROGRESS: "В работе",
  SUBMITTED: "Сдано",
  REVISION: "Доработка",
  ACCEPTED: "Принято",
  DISPUTED: "Спор",
  CANCELED: "Отменён",
  COMPLETED: "Завершён",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Сделка не оплачена",
  RESERVED: "Сумма зарезервирована под заказ",
  PAID: "Оплачен",
  REFUNDED: "Возврат",
  PAYOUT_PENDING: "К выплате",
  PAYOUT_DONE: "Выплачено",
};

export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  FIXED: "Фикс",
  HOURLY: "Почасовой",
  BY_OFFER: "По предложению",
};

export const VISIBILITY_LABELS: Record<VisibilityType, string> = {
  PLATFORM_ASSIGN: "Подбор платформой",
  OPEN_FOR_RESPONSES: "Открыт для откликов",
};
