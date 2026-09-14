-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "confirmation_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_confirmation_code_key" ON "reservations"("confirmation_code");
