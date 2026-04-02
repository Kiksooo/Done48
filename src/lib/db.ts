import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Vitest выставляет VITEST=true; при прогоне тестов не шумим P1001 в stderr. */
const silencePrismaLogs =
  process.env.VITEST === "true" || process.env.NODE_ENV === "test";

const prismaLog = silencePrismaLogs
  ? ([] as const)
  : process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [...prismaLog],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
