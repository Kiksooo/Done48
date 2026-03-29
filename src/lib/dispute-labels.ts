import type { DisputeStatus } from "@prisma/client";

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Открыт",
  IN_REVIEW: "На рассмотрении",
  RESOLVED_CUSTOMER: "В пользу заказчика",
  RESOLVED_EXECUTOR: "В пользу исполнителя",
  PARTIAL: "Частичное решение",
  CLOSED: "Закрыт",
};
