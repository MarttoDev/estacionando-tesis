'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageShell } from './page-shell'
import { deleteSpotAction, setSpotPublishedAction } from '@/lib/parking-spots/actions'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import type { OwnerSpot } from '@/lib/parking-spots/queries'

export function MySpotsList({ spots, onCreateNew, onEdit }: { spots: OwnerSpot[]; onCreateNew: () => void; onEdit: (spotId: string) => void }) {
  return (
    <PageShell eyebrow="Comparte tu espacio" title="Mis espacios" description="Administra tus estacionamientos publicados y su disponibilidad.">
      <div className="mb-6 flex justify-end">
        <button onClick={onCreateNew} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> Publicar nuevo espacio</button>
      </div>
      {spots.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aún no has publicado ningún espacio</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Comparte tu estacionamiento y empieza a recibir reservas.</p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spots.map((spot) => <SpotCard key={spot.id} spot={spot} onEdit={() => onEdit(spot.id)} />)}
        </div>
      )}
    </PageShell>
  )
}

function SpotCard({ spot, onEdit }: { spot: OwnerSpot; onEdit: () => void }) {
  const [state, formAction, pending] = useActionState(setSpotPublishedAction, undefined)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[1.5]">
        <img src={spot.image} alt={spot.title} className="size-full object-cover" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${spot.isArchived ? 'bg-destructive/10 text-destructive' : spot.isPublished ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{spot.isArchived ? 'Eliminado · reserva pendiente' : spot.isPublished ? 'Publicado' : 'Pausado'}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-medium">{spot.title}</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">{spot.comuna ?? spot.area} · {spot.type}</p>
        <p className="mt-2 text-sm tabular-nums"><b>${spot.price.toLocaleString('es-CL')}</b> <span className="text-muted-foreground">/ hora</span></p>
        <p className="mt-1 text-xs text-muted-foreground">{spot.upcomingWindowCount} horario(s) disponibles · {spot.totalReservationCount} reserva(s) en total</p>
        {spot.isArchived && <p className="mt-2 text-xs leading-5 text-muted-foreground">Eliminaste este espacio, pero sigue aquí porque aún debes cumplir {spot.activeReservationCount === 1 ? 'una reserva confirmada' : `${spot.activeReservationCount} reservas confirmadas`}. Desaparecerá por completo cuando se cumplan.</p>}
        <div className="mt-auto flex gap-2 pt-4">
          <button type="button" onClick={onEdit} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted"><Pencil className="size-3.5" /> Editar</button>
          {!spot.isArchived && (
            <form action={formAction}>
              <input type="hidden" name="spotId" value={spot.id} />
              <input type="hidden" name="isPublished" value={(!spot.isPublished).toString()} />
              <button type="submit" aria-label={spot.isPublished ? 'Pausar publicación' : 'Reactivar publicación'} disabled={pending} className="flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">{spot.isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</button>
            </form>
          )}
          <button type="button" aria-label="Eliminar espacio" onClick={() => setConfirmingDelete(true)} className="flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
      {confirmingDelete && <DeleteSpotModal spot={spot} onClose={() => setConfirmingDelete(false)} />}
    </div>
  )
}

function DeleteSpotModal({ spot, onClose }: { spot: OwnerSpot; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(deleteSpotAction, undefined)
  const router = useRouter()

  useLockBodyScroll(true)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state, router, onClose])

  const hasActiveReservations = spot.activeReservationCount > 0

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-primary/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        {hasActiveReservations ? (
          <>
            <h3 className="text-lg font-semibold">Este espacio tiene reservas activas</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Se eliminará <b className="text-foreground">{spot.title}</b> de las búsquedas y no podrás ofrecer nuevos horarios, pero como ya {spot.activeReservationCount === 1 ? 'tienes 1 reserva confirmada' : `tienes ${spot.activeReservationCount} reservas confirmadas`}, deberás cumplirla{spot.activeReservationCount === 1 ? '' : 's'} igualmente.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Si por un motivo mayor ya no puedes prestar el lugar, contacta a soporte.</p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold">¿Eliminar este espacio?</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Se eliminará <b className="text-foreground">{spot.title}</b> permanentemente. Esta acción no se puede deshacer.</p>
          </>
        )}
        {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="spotId" value={spot.id} />
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-3 text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={pending} className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-destructive-foreground disabled:opacity-50">{pending ? 'Eliminando…' : 'Eliminar'}</button>
        </form>
      </div>
    </div>
  )
}
