-- CreateTable
CREATE TABLE "change_events" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_events_pkey" PRIMARY KEY ("id")
);

-- This table never holds sensitive data (only a topic label), so it's safe to open for
-- anonymous SELECT and broadcast via Realtime: the browser only learns "something in
-- <topic> changed" and re-fetches the real data through the existing authenticated app.
ALTER TABLE "change_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read change events" ON "change_events" FOR SELECT USING (true);

-- Supabase provisions this publication by default; adding the table turns on Realtime
-- "Postgres Changes" broadcasts for inserts into it.
ALTER PUBLICATION supabase_realtime ADD TABLE "change_events";
