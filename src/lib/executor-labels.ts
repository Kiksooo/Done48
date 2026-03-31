import type { ExecutorAccountStatus, VerificationStatus } from "@prisma/client";

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  NOT_SUBMITTED: "Документы не поданы",
  PENDING: "На проверке",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

export function verificationStatusRu(status: string): string {
  return VERIFICATION_STATUS_LABELS[status as VerificationStatus] ?? status;
}

export const EXECUTOR_ACCOUNT_STATUS_LABELS: Record<ExecutorAccountStatus, string> = {
  PENDING_MODERATION: "На модерации",
  ACTIVE: "Активен",
  BLOCKED: "Заблокирован",
  ARCHIVED: "В архиве",
};

export function executorAccountStatusRu(status: string): string {
  return EXECUTOR_ACCOUNT_STATUS_LABELS[status as ExecutorAccountStatus] ?? status;
}
