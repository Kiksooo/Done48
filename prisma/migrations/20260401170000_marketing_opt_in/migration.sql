-- Product marketing subscription opt-in (идемпотентно)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptInAt" TIMESTAMP(3);
