-- AlterTable (идемпотентно: БД могла получить колонки через db push до migrate deploy)
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "moderateAllNewOrders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "requireExecutorVerificationForProposals" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "maxExecutorProposalsPerDay" INTEGER NOT NULL DEFAULT 30;
