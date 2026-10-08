'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/lib/auth/actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined)

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
      <label className="text-sm font-medium">
        <span className="flex items-center justify-between">
          Contraseña
          <Link href="/forgot-password" className="text-xs font-medium text-accent">¿Olvidaste tu contraseña?</Link>
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        {pending ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
