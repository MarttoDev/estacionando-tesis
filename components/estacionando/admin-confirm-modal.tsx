'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

type ActionState = { error: string } | { success: true } | undefined

export function AdminConfirmModal({
  title,
  description,
  action,
  hiddenFields,
  confirmLabel = 'Eliminar',
  onClose,
}: {
  title: string
  description: string
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  hiddenFields: Record<string, string>
  confirmLabel?: string
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
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
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {state && 'error' in state && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-3 text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={pending} className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-destructive-foreground disabled:opacity-50">{pending ? 'Eliminando…' : confirmLabel}</button>
        </form>
      </div>
    </div>
  )
}
