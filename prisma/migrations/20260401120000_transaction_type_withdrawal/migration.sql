-- AlterEnum (идемпотентно)
DO $$
BEGIN
  ALTER TYPE "TransactionType" ADD VALUE 'WITHDRAWAL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
