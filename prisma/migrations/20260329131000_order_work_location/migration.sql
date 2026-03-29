-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isOfflineWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workAddress" TEXT,
ADD COLUMN     "workLat" DOUBLE PRECISION,
ADD COLUMN     "workLng" DOUBLE PRECISION;
