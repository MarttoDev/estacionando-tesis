'use client'

import { useActionState } from 'react'
import { requestPasswordResetAction } from '@/lib/auth/actions'

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined)

  if (state?.success) {
    return (
      <div className="mt-7 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
        Si existe una cuenta con ese correo, te enviamos un link para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam) — el link expira en 1 hora.
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <label className="text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="tu@email.com"
        />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar link de recuperación'}
      </button>
    </form>
  )
}
