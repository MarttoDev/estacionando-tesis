'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/lib/notifications/actions'
import type { NotificationItem } from '@/lib/notifications/queries'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })

function formatRelative(date: Date) {
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, 'hour')
  return relativeTimeFormatter.format(Math.round(diffHours / 24), 'day')
}

/** Header-only notification dropdown. The bottom floating menu has its own plain bell button
 *  that navigates to a full /notifications-style view instead — see MobileNav in site-chrome.tsx. */
export function NotificationBell({ notifications, onViewAll }: { notifications: NotificationItem[]; onViewAll: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleOpenNotification(notification: NotificationItem) {
    if (notification.readAt) return
    const formData = new FormData()
    formData.set('notificationId', notification.id)
    startTransition(async () => {
      await markNotificationReadAction(undefined, formData)
      router.refresh()
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction(undefined)
      router.refresh()
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        className="relative flex items-center justify-center rounded-full border border-border p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notificaciones</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-accent hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tienes notificaciones todavía.</p>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  className={`block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted ${!notification.readAt ? 'bg-accent/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{formatRelative(notification.createdAt)}</p>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); onViewAll() }}
            className="block w-full border-t border-border px-4 py-3 text-center text-sm font-medium text-accent hover:bg-muted"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  )
}
