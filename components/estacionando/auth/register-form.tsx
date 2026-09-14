'use client'

import { useActionState } from 'react'
import { registerAction } from '@/lib/auth/actions'

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined)

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <label className="text-sm font-medium">
        Nombre completo
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Tu nombre"
        />
      </label>
      <label className="text-sm font-medium">
        RUT
        <input
          name="rut"
          type="text"
          required
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="12345678-9"
        />
      </label>
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
        Contraseña
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Mínimo 8 caracteres"
        />
      </label>
      <label className="text-sm font-medium">
        Confirmar contraseña
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Repite tu contraseña"
        />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
