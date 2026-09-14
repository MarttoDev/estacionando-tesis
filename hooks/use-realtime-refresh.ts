'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { realtimeClient } from '@/lib/realtime/client'
import type { ChangeTopic } from '@/lib/realtime/notify'

/**
 * Refreshes the current Server Components tree whenever another client (anyone, in any tab)
 * triggers a change in one of `topics`. Never reads real data over Realtime — it only reacts
 * to a lightweight "something changed" ping and re-fetches through the normal server path.
 */
export function useRealtimeRefresh(topics: ChangeTopic[]) {
  const router = useRouter()
  const topicsKey = topics.join(',')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const client = realtimeClient
    if (!client) return

    const watchedTopics = topicsKey.split(',') as ChangeTopic[]

    const channel = client
      .channel('change-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'change_events' },
        (payload) => {
          const topic = (payload.new as { topic?: string }).topic
          if (!topic || !watchedTopics.includes(topic as ChangeTopic)) return

          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => router.refresh(), 300)
        },
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      client.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, router])
}
