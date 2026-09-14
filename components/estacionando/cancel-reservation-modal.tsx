'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cancelReservationAction } from '@/lib/reservations/actions'
import { CANCELLATION_RETENTION_RATE } from '@/lib/reservations/constants'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

export function CancelReservationModal({
  reservation,
  onClose,
}: {
  reservation: { id: string; spotTitle: string; totalPrice: number }
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState(cancelReservationAction, undefined)
  const router = useRouter()

  useLockBodyScroll(true)

  useEffect(() => {
    if (state && 'success' in state) {
      router.refresh()
      onClose()
    }
  }, [state, router, onClose])

  const retained = Math.round(reservation.totalPrice * CANCELLATION_RETENTION_RATE)
  const refunded = reservation.totalPrice - retained

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold">¿Cancelar esta reserva?</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Se cancelará tu reserva en <b className="text-foreground">{reservation.spotTitle}</b>. Se te reembolsará <b className="text-foreground">${refunded.toLocaleString('es-CL')}</b> (90%), reteniendo <b className="text-foreground">${retained.toLocaleString('es-CL')}</b> (10% de ${reservation.totalPrice.toLocaleString('es-CL')}) por gastos de gestión.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Este prototipo no procesa pagos reales; el monto es solo referencial.</p>
        {state && 'error' in state && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="reservationId" value={reservation.id} />
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-3 text-sm font-medium">Volver</button>
          <button type="submit" disabled={pending} className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-destructive-foreground disabled:opacity-50">{pending ? 'Cancelando…' : 'Cancelar reserva'}</button>
        </form>
      </div>
    </div>
  )
}
