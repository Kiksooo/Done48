#!/usr/bin/env node
/**
 * npm run test:db:migrate — если БД недоступна, выходим 0 без Prisma P1001.
 * Строгий режим: REQUIRE_TEST_DB=1 → exit 1 при недоступной БД.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadEnvTest, maskDatabaseUrl, postgresTcpReachable } = require("./test-db-utils.cjs");

const strict = process.env.REQUIRE_TEST_DB === "1";

if (!loadEnvTest(root)) {
  const msg = "[test:db:migrate] Нет файла .env.test — миграции тестовой БД пропущены (скопируйте .env.test.example).";
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!url) {
  const msg = "[test:db:migrate] В .env.test нет TEST_DATABASE_URL — пропуск.";
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

const open = await postgresTcpReachable(url);
if (!open) {
  const msg =
    `[test:db:migrate] БД недоступна (${maskDatabaseUrl(url)}). Миграции пропущены.\n` +
    `Поднимите Postgres: npm run test:db:up (нужен Docker) или укажите свой URL в .env.test.\n` +
    `npm test без БД всё равно можно запускать — интеграционные тесты будут пропущены.`;
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
