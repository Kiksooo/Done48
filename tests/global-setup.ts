import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { loadEnv } from "vite";

const REACH_FILE = path.join(__dirname, "..", ".vitest-db-reachable");

function warnDbUnavailableOnce() {
  try {
    const dir = path.join(os.tmpdir(), "done48-vitest");
    mkdirSync(dir, { recursive: true });
    const flag = path.join(dir, "db-unavailable-warn");
    if (existsSync(flag)) return;
    writeFileSync(flag, new Date().toISOString());
    console.warn(
      "[vitest] БД недоступна — проверьте: npm run test:db:up, npm run test:db:migrate, файл .env.test. Интеграционные тесты пропущены.",
    );
  } catch {
    /* не мешаем прогону */
  }
}

function postgresPortReachable(urlRaw: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const u = new URL(urlRaw);
    const host = u.hostname;
    const port = u.port ? Number(u.port) : 5432;
    if (!host || Number.isNaN(port)) return Promise.resolve(false);
    return new Promise((resolve) => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.setTimeout(timeoutMs);
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("error", () => resolve(false));
    });
  } catch {
    return Promise.resolve(false);
  }
}

/**
 * Один раз до воркеров: подставляем DATABASE_URL из .env.test, проверяем TCP к Postgres без Prisma (без P1001).
 * Воркеры читают результат из .vitest-db-reachable (см. tests/setup.ts).
 */
export default async function globalSetup() {
  const root = path.resolve(__dirname, "..");
  const fromTest = loadEnv("test", root, "");

  if (fromTest.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = fromTest.TEST_DATABASE_URL;
    process.env.TEST_DATABASE_URL = fromTest.TEST_DATABASE_URL;
  } else if (fromTest.DATABASE_URL) {
    process.env.DATABASE_URL = fromTest.DATABASE_URL;
  }

  const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  let reachable: "0" | "1" = "0";
  if (url) {
    const open = await postgresPortReachable(url);
    reachable = open ? "1" : "0";
    if (!open) warnDbUnavailableOnce();
  }

  writeFileSync(REACH_FILE, reachable, "utf8");

  return async () => {
    try {
      unlinkSync(REACH_FILE);
    } catch {
      /* ignore */
    }
  };
}
