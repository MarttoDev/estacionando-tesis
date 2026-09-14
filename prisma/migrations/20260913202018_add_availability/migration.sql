-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "spot_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "availability_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_availability_id_key" ON "reservations"("availability_id");

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "parking_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "availabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
