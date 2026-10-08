'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { realtimeClient } from '@/lib/realtime/client'
import type { ChangeTopic } from '@/lib/realtime/notify'

/**
 * Runs `onChange` (debounced 300ms) whenever another client (anyone, in any tab) triggers a
 * change in one of `topics`. Never reads real data over Realtime — the payload only carries
 * the topic label; `onChange` is expected to re-fetch through the normal authenticated path.
 */
export function useRealtimeEvent(topics: ChangeTopic[], onChange: () => void) {
  const topicsKey = topics.join(',')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const client = realtimeClient
    if (!client) return

    const watchedTopics = topicsKey.split(',') as ChangeTopic[]

    const channel = client
      .channel(`change-events-${topicsKey}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'change_events' },
        (payload) => {
          const topic = (payload.new as { topic?: string }).topic
          if (!topic || !watchedTopics.includes(topic as ChangeTopic)) return

          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => onChangeRef.current(), 300)
        },
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      client.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey])
}

/** Refreshes the current Server Components tree — the common case, used by every view that
 *  doesn't manage its own client-side data (see MessagesView for the one that does). */
export function useRealtimeRefresh(topics: ChangeTopic[]) {
  const router = useRouter()
  useRealtimeEvent(topics, () => router.refresh())
}
