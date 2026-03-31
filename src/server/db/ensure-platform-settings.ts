import { prisma } from "@/lib/db";

/**
 * Self-heal для окружений со старой БД:
 * создаём таблицу PlatformSettings, если её ещё нет.
 */
export async function ensurePlatformSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PlatformSettings" (
      "id" TEXT NOT NULL DEFAULT 'default',
      "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
      "minPayoutCents" INTEGER NOT NULL DEFAULT 1000,
      "moderateAllNewOrders" BOOLEAN NOT NULL DEFAULT true,
      "requireExecutorVerificationForProposals" BOOLEAN NOT NULL DEFAULT true,
      "maxExecutorProposalsPerDay" INTEGER NOT NULL DEFAULT 30,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "PlatformSettings" (
      "id",
      "platformFeePercent",
      "minPayoutCents",
      "moderateAllNewOrders",
      "requireExecutorVerificationForProposals",
      "maxExecutorProposalsPerDay"
    )
    VALUES ('default', 10, 1000, true, true, 30)
    ON CONFLICT ("id") DO NOTHING;
  `);
}

