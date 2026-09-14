'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { BadgeCheck, Calendar, CalendarCheck, Camera, Car, Check, Home, IdCard, LockKeyhole, LogOut, ScanFace, Shield, Star, UserRound } from 'lucide-react'
import { PageShell } from './page-shell'
import { logoutAction, updateAvatarAction, updatePasswordAction } from '@/lib/auth/actions'
import { compressImage } from '@/lib/estacionando/compress-image'
import type { ScanState } from '@/lib/estacionando/types'
import type { SessionUser } from '@/lib/auth/types'

export function Profile({
  user,
  verified,
  scanState,
  startScan,
  reservationsMadeCount,
  reservationsReceivedCount,
  spotsPublishedCount,
}: {
  user: SessionUser | null
  verified: boolean
  scanState: ScanState
  startScan: () => void
  reservationsMadeCount: number
  reservationsReceivedCount: number
  spotsPublishedCount: number
}) {
  if (!user) {
    return <PageShell eyebrow="Tu cuenta" title="Perfil y confianza" description="Inicia sesión para ver tu perfil, verificar tu identidad y publicar espacios."><div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center"><UserRound className="size-10 text-accent" /><h2 className="mt-4 text-xl font-semibold">Aún no has iniciado sesión</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Crea una cuenta o inicia sesión para gestionar tu perfil.</p><div className="mt-5 flex gap-3"><Link href="/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Iniciar sesión</Link><Link href="/register" className="rounded-full border border-border px-5 py-3 text-sm font-medium">Crear cuenta</Link></div></div></PageShell>
  }

  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <PageShell
      eyebrow="Tu cuenta"
      title={user.isAdmin ? 'Perfil de administrador' : 'Perfil y confianza'}
      description={user.isAdmin ? 'Gestiona tu cuenta de administrador de estacionando.' : 'Tu identidad verificada hace que compartir espacios sea más seguro para todos.'}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="min-w-0 rounded-3xl bg-primary p-7 text-primary-foreground">
          <AvatarUploader user={user} initials={initials} />
          <h2 className="mt-5 text-2xl font-semibold">{user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-8 border-t border-border pt-5">
            {user.isAdmin ? (
              <>
                <p className="text-xs text-primary-foreground/60">Rol de la cuenta</p>
                <div className="mt-3 flex items-center gap-2"><Shield className="size-4 fill-accent text-accent" /><b>Administrador</b></div>
              </>
            ) : (
              <>
                <p className="text-xs text-primary-foreground/60">Tu reputación</p>
                <div className="mt-3 flex items-center gap-2"><Star className="size-4 fill-accent text-accent" /><b>Nuevo miembro</b></div>
              </>
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-border pt-5">
            <div className="rounded-2xl bg-primary-foreground/[0.07] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-primary-foreground/50"><IdCard className="size-3.5" /> RUT</p>
              <p className="mt-1.5 truncate text-sm font-semibold">{user.rut}</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/[0.07] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-primary-foreground/50"><Calendar className="size-3.5" /> Miembro desde</p>
              <p className="mt-1.5 truncate text-sm font-semibold capitalize">{formatMemberSince(user.createdAt)}</p>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            <StatCell icon={Car} value={spotsPublishedCount} label="Espacios" />
            <StatCell icon={CalendarCheck} value={reservationsMadeCount} label="Reservas" />
            <StatCell icon={Home} value={reservationsReceivedCount} label="Recibidas" />
          </div>
          <form action={logoutAction} className="mt-5 border-t border-border pt-5"><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/15"><LogOut className="size-4" /> Cerrar sesión</button></form>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          {user.isAdmin && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
              <div className="flex items-center gap-4"><span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Shield className="size-5" /></span><div><h2 className="text-lg font-semibold">Cuenta de administrador</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Tienes acceso al panel de administración. No necesitas verificar tu identidad: los administradores no publican espacios ni hacen reservas como anfitriones o clientes verificados.</p></div></div>
              <Link href="/admin" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground sm:w-auto"><Shield className="size-4" /> Ir al panel de administración</Link>
            </div>
          )}
          {!user.isAdmin && (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><span className="inline-flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"><ScanFace className="size-5" /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">Verificación facial</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Comprobamos que eres una persona real. Tu rostro se procesa solo en este prototipo y no se guarda.</p></div>{verified && <BadgeCheck className="size-7 text-accent" />}</div><div className="mt-7 rounded-2xl border border-dashed border-border bg-muted/50 p-6 text-center">{scanState === 'scanning' ? <><div className="mx-auto flex size-20 animate-pulse items-center justify-center rounded-full border-4 border-accent bg-accent/10"><ScanFace className="size-9 text-accent" /></div><p className="mt-4 font-medium">Analizando tu rostro…</p><p className="mt-1 text-xs text-muted-foreground">Mantén la mirada al frente</p></> : scanState === 'done' ? <><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="size-9" /></div><p className="mt-4 font-medium">Identidad verificada</p><p className="mt-1 text-xs text-muted-foreground">Ya puedes reservar y publicar espacios.</p></> : <><Camera className="mx-auto size-9 text-muted-foreground" /><p className="mt-4 font-medium">Listo para comenzar</p><p className="mt-1 text-xs text-muted-foreground">Te tomará menos de un minuto.</p></>}</div>{!verified && <button disabled={scanState === 'scanning'} onClick={startScan} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"><ScanFace className="size-4" /> {scanState === 'scanning' ? 'Verificando…' : 'Comenzar verificación'}</button>}<div className="mt-5 flex gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4 shrink-0" /> Sin fotos guardadas. Esta simulación no usa cámara real.</div></div>
          )}
          <PasswordForm />
        </div>
      </div>
    </PageShell>
  )
}

function formatMemberSince(date: Date) {
  return new Date(date).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

function StatCell({ icon: Icon, value, label }: { icon: typeof Car; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-primary-foreground/[0.07] px-2 py-3.5 text-center">
      <Icon className="size-4 text-accent" />
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-primary-foreground/60">{label}</p>
    </div>
  )
}

function AvatarUploader({ user, initials }: { user: SessionUser; initials: string }) {
  const [state, formAction, pending] = useActionState(updateAvatarAction, undefined)
  const [preview, setPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (state && 'success' in state && state.success) router.refresh()
  }, [state, router])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleFileChange(input: HTMLInputElement) {
    const file = input.files?.[0]
    if (!file) return

    const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800 })
    if (compressed !== file) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(compressed)
      input.files = dataTransfer.files
    }

    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(compressed)
    })
    formRef.current?.requestSubmit()
  }

  const avatarSrc = preview ?? user.avatarUrl

  return (
    <div>
      <form action={formAction} ref={formRef}>
        <label className="group relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-accent text-2xl font-semibold text-accent-foreground">
          {avatarSrc ? <img src={avatarSrc} alt={user.name} className="size-full object-cover" /> : initials}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera className="size-5 text-white" />
          </span>
          <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleFileChange(event.currentTarget)} />
        </label>
      </form>
      {pending && <p className="mt-2 text-xs text-primary-foreground/70">Subiendo…</p>}
      {state && 'error' in state && state.error && <p className="mt-2 inline-block rounded-full bg-destructive px-2.5 py-1 text-xs text-destructive-foreground">{state.error}</p>}
    </div>
  )
}

function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <h2 className="text-xl font-semibold tracking-[-0.05em]">Cambiar contraseña</h2>
      <p className="mt-2 text-sm text-muted-foreground">Usa una contraseña que no compartas en otros sitios.</p>
      <form action={formAction} ref={formRef} className="mt-6 flex flex-col gap-4">
        <label className="text-sm font-medium">Contraseña actual
          <input name="currentPassword" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </label>
        <label className="text-sm font-medium">Nueva contraseña
          <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </label>
        <label className="text-sm font-medium">Confirmar nueva contraseña
          <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </label>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && <p className="text-sm text-accent">Contraseña actualizada correctamente.</p>}
        <button type="submit" disabled={pending} className="mt-1 self-start rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : 'Actualizar contraseña'}</button>
      </form>
    </div>
  )
}
