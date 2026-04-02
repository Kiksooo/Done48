/**
 * Запуск prisma CLI с переменными из .env.test (DATABASE_URL из TEST_DATABASE_URL).
 * Пример: node scripts/prisma-with-test-env.cjs migrate deploy
 */
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env.test");

if (!existsSync(envFile)) {
  console.error("Нет .env.test. Скопируйте .env.test.example → .env.test");
  process.exit(1);
}

for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Укажите команду prisma, например: migrate deploy");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
