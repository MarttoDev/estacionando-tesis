import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/estacionando/auth/forgot-password-form'
import { BrandMark } from '@/components/estacionando/brand-mark'
import { getCurrentUser } from '@/lib/auth/dal'

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <BrandMark />
          <span className="text-lg font-semibold tracking-[-0.04em]">
            estacionando<span className="text-accent">.</span>
          </span>
        </Link>
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-[-0.05em]">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingresa tu email y te mandamos un link para restablecerla.</p>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="font-medium text-accent">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
