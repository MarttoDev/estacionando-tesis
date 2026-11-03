-- AlterTable
ALTER TABLE "identity_verifications" ADD COLUMN "session_id" TEXT;
ALTER TABLE "identity_verifications" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
