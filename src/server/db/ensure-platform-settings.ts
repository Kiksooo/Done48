import { prisma } from "@/lib/db";

/**
 * Self-heal для окружений со старой/частичной БД:
 * создаём таблицу PlatformSettings и добиваем недостающие колонки / PK.
 * CREATE TABLE IF NOT EXISTS не изменяет уже существующую «пустую» таблицу — для этого ALTER ниже.
 */
export async function ensurePlatformSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PlatformSettings" (
      "id" TEXT NOT NULL DEFAULT 'default',
      "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
      "minPayoutCents" INTEGER NOT NULL DEFAULT 1000,
      "moderateAllNewOrders" BOOLEAN NOT NULL DEFAULT true,
      "requireExecutorVerificationForProposals" BOOLEAN NOT NULL DEFAULT false,
      "maxExecutorProposalsPerDay" INTEGER NOT NULL DEFAULT 30,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 10;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "minPayoutCents" INTEGER NOT NULL DEFAULT 1000;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "moderateAllNewOrders" BOOLEAN NOT NULL DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "requireExecutorVerificationForProposals" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "maxExecutorProposalsPerDay" INTEGER NOT NULL DEFAULT 30;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  `);

  await prisma.$executeRawUnsafe(`
    DO $pk$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'PlatformSettings'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class c ON con.conrelid = c.oid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'PlatformSettings' AND con.contype = 'p'
      ) THEN
        ALTER TABLE "PlatformSettings" ADD CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id");
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN
        RETURN;
    END
    $pk$;
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
    VALUES ('default', 10, 1000, true, false, 30)
    ON CONFLICT ("id") DO NOTHING;
  `);
}
