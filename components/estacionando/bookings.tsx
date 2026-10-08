'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Ban, CalendarDays, Check, MessageCircle, Navigation, ShieldCheck, UserRound } from 'lucide-react'
import { PageShell } from './page-shell'
import { RouteToSpotModal } from './route-to-spot-modal'
import { CancelReservationModal } from './cancel-reservation-modal'
import { formatReservationRange } from '@/lib/estacionando/format'
import type { SessionUser } from '@/lib/auth/types'
import type { ReservationView } from '@/lib/reservations/queries'
import type { StartConversationState } from '@/lib/messages/actions'

type Tab = 'active' | 'completed'

export function Bookings({
  user,
  reservations,
  onExplore,
  onMessageHost,
}: {
  user: SessionUser | null
  reservations: ReservationView[]
  onExplore: () => void
  onMessageHost: (spotId: string) => Promise<StartConversationState>
}) {
  const [tab, setTab] = useState<Tab>('active')
  const [routeSpot, setRouteSpot] = useState<{ title: string; latitude: number; longitude: number } | null>(null)
  const [cancelling, setCancelling] = useState<{ id: string; spotTitle: string; totalPrice: number } | null>(null)
  const [messagingId, setMessagingId] = useState<string | null>(null)
  const now = useMemo(() => new Date(), [])

  async function handleMessageHost(reservationId: string, spotId: string) {
    setMessagingId(reservationId)
    await onMessageHost(spotId)
    setMessagingId(null)
  }

  const active = useMemo(() => reservations.filter((reservation) => reservation.endTime > now && reservation.status !== 'CANCELLED'), [reservations, now])
  const completed = useMemo(() => reservations.filter((reservation) => reservation.endTime <= now || reservation.status === 'CANCELLED'), [reservations, now])
  const visible = tab === 'active' ? active : completed

  if (!user) {
    return (
      <PageShell eyebrow="Tu movilidad" title="Mis reservas" description="Inicia sesión para ver y gestionar tus reservas.">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center">
          <UserRound className="size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Aún no has iniciado sesión</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Crea una cuenta o inicia sesión para ver tus reservas.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Iniciar sesión</Link>
            <Link href="/register" className="rounded-full border border-border px-5 py-3 text-sm font-medium">Crear cuenta</Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow="Tu movilidad" title="Mis reservas" description="Todo lo que necesitas para llegar, estacionar y seguir.">
      <div className="mb-6 flex w-fit rounded-full border border-border p-1">
        <button onClick={() => setTab('active')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === 'active' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Activas {active.length > 0 && <span className="tabular-nums">({active.length})</span>}
        </button>
        <button onClick={() => setTab('completed')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === 'completed' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Completadas {completed.length > 0 && <span className="tabular-nums">({completed.length})</span>}
        </button>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="flex min-w-0 flex-col gap-5">
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
              <EmptyBookings tab={tab} onExplore={onExplore} />
            </div>
          ) : (
            visible.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl border border-border bg-card p-5 sm:p-7">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    {reservation.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"><Ban className="size-3.5" /> Cancelada</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tab === 'active' ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                        <Check className="size-3.5" /> {tab === 'active' ? 'Confirmada' : 'Completada'}
                      </span>
                    )}
                    <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">{reservation.spotTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{formatReservationRange(reservation.startTime, reservation.endTime)} · {reservation.spotArea}</p>
                  </div>
                </div>
                <div className="mt-7 rounded-2xl bg-muted p-5">
                  <p className="text-xs text-muted-foreground">Código de acceso</p>
                  <p className="mt-2 break-all font-mono text-2xl tracking-[0.2em] sm:text-3xl">{reservation.confirmationCode}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Muéstralo al llegar al estacionamiento.</p>
                </div>
                {tab === 'active' && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {reservation.spotLatitude !== null && reservation.spotLongitude !== null && (
                      <button
                        onClick={() => setRouteSpot({ title: reservation.spotTitle, latitude: reservation.spotLatitude as number, longitude: reservation.spotLongitude as number })}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/10"
                      >
                        <Navigation className="size-4" /> Ir al lugar
                      </button>
                    )}
                    <button
                      onClick={() => handleMessageHost(reservation.id, reservation.spotId)}
                      disabled={messagingId === reservation.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      <MessageCircle className="size-4" /> {messagingId === reservation.id ? 'Abriendo chat…' : 'Mensaje al anfitrión'}
                    </button>
                    <button
                      onClick={() => setCancelling({ id: reservation.id, spotTitle: reservation.spotTitle, totalPrice: reservation.totalPrice })}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      <Ban className="size-4" /> Cancelar reserva
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="min-w-0 rounded-3xl border border-accent/20 bg-accent/10 p-6 text-foreground">
          <p className="text-sm text-muted-foreground">Tu actividad</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">Reserva con confianza.</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Cada espacio tiene un anfitrión verificado y detalles claros antes de confirmar.</p>
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-sm"><ShieldCheck className="size-5 text-accent" /> Pagos y datos protegidos</div>
        </div>
      </div>
      {routeSpot && <RouteToSpotModal spot={routeSpot} onClose={() => setRouteSpot(null)} />}
      {cancelling && <CancelReservationModal reservation={cancelling} onClose={() => setCancelling(null)} />}
    </PageShell>
  )
}

function EmptyBookings({ tab, onExplore }: { tab: Tab; onExplore: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <CalendarDays className="size-10 text-accent" />
      <h2 className="mt-4 text-xl font-semibold">{tab === 'active' ? 'Aún no tienes reservas activas' : 'Aún no tienes reservas completadas'}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{tab === 'active' ? 'Encuentra un lugar cerca de tu destino y déjalo listo para cuando llegues.' : 'Cuando termine una de tus reservas, aparecerá aquí.'}</p>
      {tab === 'active' && <button onClick={onExplore} className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Explorar estacionamientos</button>}
    </div>
  )
}
