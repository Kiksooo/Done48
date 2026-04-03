-- AlterTable
ALTER TABLE "ExecutorProfile" ADD COLUMN "orderCities" TEXT[] DEFAULT ARRAY[]::TEXT[];
