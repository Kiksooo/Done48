-- Временно без ручной модерации: все ожидающие — активны, новые профили по умолчанию ACTIVE.
UPDATE "ExecutorProfile"
SET "accountStatus" = 'ACTIVE'
WHERE "accountStatus" = 'PENDING_MODERATION';

ALTER TABLE "ExecutorProfile" ALTER COLUMN "accountStatus" SET DEFAULT 'ACTIVE';
