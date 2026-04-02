#!/usr/bin/env node
/**
 * npm run test:db:down — без ошибки, если Docker не установлен.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const r = spawnSync(
  "docker",
  ["compose", "-f", "docker-compose.test.yml", "down", "-v"],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (r.error?.code === "ENOENT") {
  console.warn("[test:db:down] Docker не найден — контейнеры не запускались, делать нечего.");
  process.exit(0);
}

if (r.status !== 0) {
  const msg = (r.stderr || r.stdout || "").trim();
  if (msg) console.error(msg);
  process.exit(r.status ?? 1);
}

console.log("Тестовый Postgres остановлен, volume удалён.");
process.exit(0);
