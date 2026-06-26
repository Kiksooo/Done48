import type {
  BudgetType,
  OrderStatus,
  PaymentStatus,
  VisibilityType,
} from "@prisma/client";

/** Пять статусов для заказчика (внутренние enum не меняем). */
export function getCustomerOrderStatusLabel(status: OrderStatus): string {
  if (status === "DRAFT" || status === "NEW" || status === "ON_MODERATION") {
    return "Задача создана";
  }
  if (status === "PUBLISHED") return "Ищем исполнителя";
  if (status === "ASSIGNED") return "Исполнитель найден";
  if (status === "IN_PROGRESS" || status === "SUBMITTED" || status === "REVISION" || status === "DISPUTED") {
    return "Задача в работе";
  }
  if (status === "ACCEPTED" || status === "COMPLETED") return "Выполнено";
  if (status === "CANCELED") return "Отменено";
  return ORDER_STATUS_LABELS[status];
}

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
  PLATFORM_ASSIGN: "Подбор сервисом",
  OPEN_FOR_RESPONSES: "Подбор сервисом",
};
