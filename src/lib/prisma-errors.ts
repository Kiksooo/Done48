/** Prisma P2034 — конфликт сериализуемой транзакции (PostgreSQL). */
export function isPrismaTransactionConflict(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}
