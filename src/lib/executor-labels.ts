import type { ExecutorAccountStatus } from "@prisma/client";

export const EXECUTOR_ACCOUNT_STATUS_LABELS: Record<ExecutorAccountStatus, string> = {
  PENDING_MODERATION: "На модерации",
  ACTIVE: "Активен",
  BLOCKED: "Заблокирован",
  ARCHIVED: "В архиве",
};

export function executorAccountStatusRu(status: string): string {
  return EXECUTOR_ACCOUNT_STATUS_LABELS[status as ExecutorAccountStatus] ?? status;
}
