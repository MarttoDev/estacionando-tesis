'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { createReviewAction } from '@/lib/reviews/actions'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

export function ReviewModal({
  reservationId,
  title,
  targetName,
  onClose,
}: {
  reservationId: string
  title: string
  targetName: string
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState(createReviewAction, undefined)
  const [rating, setRating] = useState(0)
  const router = useRouter()

  useLockBodyScroll(true)

  useEffect(() => {
    if (state && 'success' in state) {
      router.refresh()
      onClose()
    }
  }, [state, router, onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold">Calificar {targetName}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Cuéntale a la comunidad cómo fue tu experiencia en <b className="text-foreground">{title}</b>.
        </p>

        <div className="mt-5 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} estrellas`}
              onClick={() => setRating(value)}
              className="rounded-full p-1 transition hover:scale-110"
            >
              <Star className={`size-7 ${value <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
            </button>
          ))}
        </div>

        {state && 'error' in state && <p className="mt-3 text-sm text-destructive">{state.error}</p>}

        <form action={formAction} className="mt-5">
          <input type="hidden" name="reservationId" value={reservationId} />
          <input type="hidden" name="rating" value={rating} />
          <label className="block text-sm font-medium">
            Comentario (opcional)
            <textarea
              name="comment"
              rows={3}
              placeholder="¿Qué te pareció?"
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-3 text-sm font-medium">Volver</button>
            <button type="submit" disabled={pending || rating === 0} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {pending ? 'Guardando…' : 'Enviar calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
