-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "total_price" INTEGER;

-- Backfill existing rows from the spot's current price per hour before enforcing NOT NULL
UPDATE "reservations" r
SET "total_price" = ROUND(EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600.0 * p.price_per_hour)
FROM "parking_spots" p
WHERE r.spot_id = p.id;

ALTER TABLE "reservations" ALTER COLUMN "total_price" SET NOT NULL;
