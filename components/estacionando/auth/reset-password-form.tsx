'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPasswordAction } from '@/lib/auth/actions'

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined)

  if (state?.success) {
    return (
      <div className="mt-7 flex flex-col gap-4">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
          Tu contraseña se actualizó. Cerramos todas tus sesiones activas por seguridad — inicia sesión de nuevo con tu nueva contraseña.
        </div>
        <Link href="/login" className="rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="text-sm font-medium">
        Nueva contraseña
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="••••••••"
        />
      </label>
      <label className="text-sm font-medium">
        Confirma la nueva contraseña
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="••••••••"
        />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Actualizando…' : 'Restablecer contraseña'}
      </button>
    </form>
  )
}
