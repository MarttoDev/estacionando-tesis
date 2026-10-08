-- AlterTable: link notifications to the reservation they're about (nullable — SPOT_PUBLISHED/ADMIN_ALERT have none)
ALTER TABLE "notifications" ADD COLUMN "reservation_id" TEXT;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
