-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ACTIVE', 'REMOVED', 'APPEALED');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "reviews" ADD COLUMN "removal_reason" TEXT;
ALTER TABLE "reviews" ADD COLUMN "appeal_message" TEXT;
ALTER TABLE "reviews" ADD COLUMN "appealed_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "moderated_at" TIMESTAMP(3);
