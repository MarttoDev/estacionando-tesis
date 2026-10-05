-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable: replace the done boolean with a status column, backfilling from it
ALTER TABLE "tasks" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'TODO';
UPDATE "tasks" SET "status" = 'DONE' WHERE "done" = true;
ALTER TABLE "tasks" DROP COLUMN "done";
