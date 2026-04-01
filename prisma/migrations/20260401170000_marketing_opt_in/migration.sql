-- Product marketing subscription opt-in
ALTER TABLE "User"
ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingOptInAt" TIMESTAMP(3);
