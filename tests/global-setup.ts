/**
 * Подмена URL БД для интеграционных тестов до импорта Prisma в воркерах.
 */
export default async function globalSetup() {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
}
