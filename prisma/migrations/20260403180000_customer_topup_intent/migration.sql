-- CreateEnum
CREATE TYPE "CustomerTopUpIntentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "CustomerTopUpIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "providerSessionId" TEXT,
    "status" "CustomerTopUpIntentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerTopUpIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerTopUpIntent_providerSessionId_key" ON "CustomerTopUpIntent"("providerSessionId");

CREATE INDEX "CustomerTopUpIntent_userId_status_idx" ON "CustomerTopUpIntent"("userId", "status");

ALTER TABLE "CustomerTopUpIntent" ADD CONSTRAINT "CustomerTopUpIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
