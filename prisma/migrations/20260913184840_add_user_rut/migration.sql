-- AlterTable
ALTER TABLE "users" ADD COLUMN "rut" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");
