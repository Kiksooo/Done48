-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "moderateAllNewOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireExecutorVerificationForProposals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxExecutorProposalsPerDay" INTEGER NOT NULL DEFAULT 30;
