import { prisma } from '@/lib/db/prisma'

export type ChangeTopic = 'parking_spots' | 'reservations' | 'users' | 'tasks' | 'notifications' | 'messages'

/**
 * Records that something changed in `topic`. The row itself carries no data beyond the
 * topic label — browsers subscribed via Supabase Realtime learn only "something changed",
 * then re-fetch the real data through the normal authenticated app (Server Components /
 * Server Actions), never through Realtime itself.
 */
export async function notifyChange(topic: ChangeTopic) {
  await prisma.changeEvent.create({ data: { topic } })
}
