#!/usr/bin/env node
/**
 * npm run test:db:up — без «sh: docker: command not found».
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const r = spawnSync(
  "docker",
  ["compose", "-f", "docker-compose.test.yml", "up", "-d", "--wait"],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (r.error) {
  if (r.error.code === "ENOENT") {
    console.warn(
      "[test:db:up] Docker не найден в PATH — контейнер не поднят.\n" +
        "Установите и запустите Docker Desktop: https://docs.docker.com/desktop/install/mac-install/\n" +
        "Затем снова: npm run test:db:up\n" +
        "Без Docker: npm run test:db:migrate и npm test завершатся без падения (миграции/интеграции пропускаются).",
    );
    process.exit(0);
  }
  console.error(r.error.message);
  process.exit(1);
}

if (r.status !== 0) {
  const msg = (r.stderr || r.stdout || "").trim();
  if (msg) console.error(msg);
  process.exit(r.status ?? 1);
}

console.log("Тестовый Postgres поднят (docker-compose.test.yml).");
process.exit(0);
