import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll } from "vitest";
import { prisma } from "@/lib/db";

const REACH_FILE = path.join(__dirname, "..", ".vitest-db-reachable");

/** Значение выставляет tests/global-setup.ts до запуска воркеров. */
if (existsSync(REACH_FILE)) {
  process.env.VITEST_DB_REACHABLE = readFileSync(REACH_FILE, "utf8").trim().slice(0, 1);
} else {
  process.env.VITEST_DB_REACHABLE = "0";
}

afterAll(async () => {
  await prisma.$disconnect();
});
