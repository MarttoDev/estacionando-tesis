'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, UserRound } from 'lucide-react'
import { PageShell } from './page-shell'
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/lib/notifications/actions'
import type { NotificationItem } from '@/lib/notifications/queries'
import type { SessionUser } from '@/lib/auth/types'

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })

export function NotificationsView({ user, notifications }: { user: SessionUser | null; notifications: NotificationItem[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const unreadCount = notifications.filter((n) => !n.readAt).length

  if (!user) {
    return (
      <PageShell eyebrow="Tu actividad" title="Notificaciones" description="Inicia sesión para ver tus notificaciones.">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center">
          <UserRound className="size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Aún no has iniciado sesión</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Crea una cuenta o inicia sesión para ver tus notificaciones.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Iniciar sesión</Link>
            <Link href="/register" className="rounded-full border border-border px-5 py-3 text-sm font-medium">Crear cuenta</Link>
          </div>
        </div>
      </PageShell>
    )
  }

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
    <PageShell eyebrow="Tu actividad" title="Notificaciones" description="Reservas, cancelaciones y recordatorios sobre tu cuenta y tus espacios.">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</p>
        {unreadCount > 0 && (
          <button type="button" onClick={handleMarkAllRead} className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center">
          <Bell className="size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Aún no tienes notificaciones</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Cuando reserves, publiques, o algo cambie en tu cuenta, va a aparecer acá.</p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleOpenNotification(notification)}
              className={`flex min-w-0 items-start gap-4 rounded-3xl border p-5 text-left transition sm:p-6 ${notification.readAt ? 'border-border bg-card' : 'border-accent/30 bg-accent/5 hover:bg-accent/10'}`}
            >
              <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${notification.readAt ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}>
                <Bell className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{notification.title}</p>
                  {!notification.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">{dateTimeFormatter.format(notification.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  )
}
