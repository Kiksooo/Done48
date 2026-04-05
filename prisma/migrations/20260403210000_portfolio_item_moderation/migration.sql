-- CreateEnum
CREATE TYPE "PortfolioItemModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN "moderationStatus" "PortfolioItemModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "PortfolioItem" ADD COLUMN "moderationNote" TEXT;

-- Существующие работы оставляем опубликованными
UPDATE "PortfolioItem" SET "moderationStatus" = 'APPROVED';

-- CreateIndex
CREATE INDEX "PortfolioItem_moderationStatus_idx" ON "PortfolioItem"("moderationStatus");
