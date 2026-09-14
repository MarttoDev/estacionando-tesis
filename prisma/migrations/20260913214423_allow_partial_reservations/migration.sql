-- DropIndex
DROP INDEX "reservations_availability_id_key";

-- CreateIndex
CREATE INDEX "reservations_spot_id_status_idx" ON "reservations"("spot_id", "status");
