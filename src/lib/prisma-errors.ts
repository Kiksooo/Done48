/** Prisma P2034 — конфликт сериализуемой транзакции (PostgreSQL). */
export function isPrismaTransactionConflict(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

/**
 * P2021 — таблицы нет в БД (часто забыли `prisma migrate deploy` после деплоя).
 * Без обработки прод падает на запросах к новой таблице/связи.
 */
export function isPrismaTableDoesNotExist(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "P2021") return true;
  const msg = String((error as { message?: string }).message ?? "");
  return (
    /does not exist/i.test(msg) &&
    (/relation|table/i.test(msg) || /OrderCustomerPartner/i.test(msg))
  );
}
