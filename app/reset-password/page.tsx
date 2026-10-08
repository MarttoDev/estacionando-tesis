import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/estacionando/auth/reset-password-form'
import { BrandMark } from '@/components/estacionando/brand-mark'
import { getCurrentUser } from '@/lib/auth/dal'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const user = await getCurrentUser()
  if (user) redirect('/')

  const { token } = await searchParams

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
          {token ? (
            <>
              <h1 className="text-2xl font-semibold tracking-[-0.05em]">Restablece tu contraseña</h1>
              <p className="mt-2 text-sm text-muted-foreground">Elige una contraseña nueva para tu cuenta.</p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-[-0.05em]">Link inválido</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Este link no incluye el código necesario para restablecer tu contraseña. Solicita uno nuevo.
              </p>
              <Link href="/forgot-password" className="mt-6 block rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground">
                Solicitar link de recuperación
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
