'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ban, Building2, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, GripVertical, ListChecks, LogOut, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { BrandMark } from './brand-mark'
import { ThemeToggle } from './theme-toggle'
import { AdminConfirmModal } from './admin-confirm-modal'
import { logoutAction } from '@/lib/auth/actions'
import { promoteAdminAction, demoteAdminAction, deleteSpotAdminAction, deleteUserAdminAction, cancelReservationAdminAction, moveTaskAction, assignTaskAction } from '@/lib/admin/actions'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import type { AdminDashboardData } from '@/lib/admin/queries'
import type { SessionUser } from '@/lib/auth/types'

const dateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' })
const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })

type Tab = 'resumen' | 'usuarios' | 'espacios' | 'reservas' | 'administradores' | 'tareas'

export function AdminPanel({ user, data }: { user: SessionUser; data: AdminDashboardData }) {
  const [tab, setTab] = useState<Tab>('resumen')
  useRealtimeRefresh(['parking_spots', 'reservations', 'users', 'tasks'])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-[-0.04em]">estacionando<span className="text-accent">.</span></span>
            <span className="hidden rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent sm:inline-flex">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="rounded-full border border-border px-3.5 py-2 text-sm font-medium hover:bg-muted">Ver como cliente</Link>
            <form action={logoutAction}>
              <button type="submit" aria-label="Cerrar sesión" className="flex items-center gap-2 rounded-full border border-border p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:px-3.5"><LogOut className="size-4" /><span className="hidden sm:inline">Salir</span></button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-8 lg:px-10">
        <div className="mb-1 text-sm text-muted-foreground">Hola, {user.name.split(' ')[0]}</div>
        <h1 className="text-3xl font-semibold tracking-[-0.05em]">Panel de administración</h1>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Usuarios" value={data.stats.totalUsers} />
          <StatCard label="Administradores" value={data.stats.totalAdmins} />
          <StatCard label="Espacios totales" value={data.stats.totalSpots} />
          <StatCard label="Espacios publicados" value={data.stats.publishedSpots} />
          <StatCard label="Reservas totales" value={data.stats.totalReservations} />
          <StatCard label="Reservas activas" value={data.stats.activeReservations} />
        </div>

        <div className="mt-8 flex w-fit flex-wrap rounded-full border border-border p-1">
          {([
            ['resumen', 'Resumen'],
            ['usuarios', 'Usuarios'],
            ['espacios', 'Espacios'],
            ['reservas', 'Reservas'],
            ['administradores', 'Administradores'],
            ['tareas', 'Tareas Pendientes'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'resumen' && <ResumenTab data={data} />}
          {tab === 'usuarios' && <UsuariosTab users={data.users} currentUserId={user.id} />}
          {tab === 'espacios' && <EspaciosTab spots={data.spots} />}
          {tab === 'reservas' && <ReservasTab reservations={data.activeReservations} />}
          {tab === 'administradores' && <AdministradoresTab users={data.users} currentUserId={user.id} />}
          {tab === 'tareas' && <TareasTab tasks={data.tasks} users={data.users} />}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ResumenTab({ data }: { data: AdminDashboardData }) {
  const recentUsers = data.users.slice(0, 5)
  const recentSpots = data.spots.slice(0, 5)

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <div className="min-w-0 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2"><Users className="size-4 text-accent" /><h2 className="text-lg font-semibold">Últimos usuarios registrados</h2></div>
        <div className="mt-4 flex flex-col gap-3">
          {recentUsers.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay usuarios.</p>}
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{u.name}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div>
              <span className="shrink-0 text-xs text-muted-foreground">{dateFormatter.format(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2"><Building2 className="size-4 text-accent" /><h2 className="text-lg font-semibold">Últimos espacios publicados</h2></div>
        <div className="mt-4 flex flex-col gap-3">
          {recentSpots.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay espacios.</p>}
          {recentSpots.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{s.title}</p><p className="truncate text-xs text-muted-foreground">{s.comuna ?? s.area} · ${s.price.toLocaleString('es-CL')}/h</p></div>
              <span className="shrink-0 text-xs text-muted-foreground">{dateFormatter.format(s.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsuariosTab({ users, currentUserId }: { users: AdminDashboardData['users']; currentUserId: string }) {
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">RUT</th>
              <th className="px-5 py-3 font-medium">Espacios</th>
              <th className="px-5 py-3 font-medium">Reservas</th>
              <th className="px-5 py-3 font-medium">Miembro desde</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{u.name}</p>
                        {u.isAdmin && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"><ShieldCheck className="size-3" /> Admin</span>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {u.id !== currentUserId && (
                      <button onClick={() => setDeleting({ id: u.id, name: u.name })} aria-label={`Eliminar ${u.name}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
                        <Trash2 className="size-3.5" /> Eliminar
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 tabular-nums">{u.rut}</td>
                <td className="px-5 py-3 tabular-nums">{u.spotsCount}</td>
                <td className="px-5 py-3 tabular-nums">{u.reservationsCount}</td>
                <td className="px-5 py-3 text-muted-foreground">{dateFormatter.format(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col divide-y divide-border sm:hidden">
        {users.map((u) => (
          <details key={u.id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{u.name}</p>
                  {u.isAdmin && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"><ShieldCheck className="size-3" /> Admin</span>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">RUT</p><p className="tabular-nums">{u.rut}</p></div>
              <div><p className="text-xs text-muted-foreground">Miembro desde</p><p>{dateFormatter.format(u.createdAt)}</p></div>
              <div><p className="text-xs text-muted-foreground">Espacios</p><p className="tabular-nums">{u.spotsCount}</p></div>
              <div><p className="text-xs text-muted-foreground">Reservas</p><p className="tabular-nums">{u.reservationsCount}</p></div>
            </div>
            {u.id !== currentUserId && (
              <button onClick={() => setDeleting({ id: u.id, name: u.name })} aria-label={`Eliminar ${u.name}`} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
                <Trash2 className="size-3.5" /> Eliminar usuario
              </button>
            )}
          </details>
        ))}
      </div>

      {users.length === 0 && <p className="p-6 text-sm text-muted-foreground">Aún no hay usuarios registrados.</p>}
      {deleting && (
        <AdminConfirmModal
          title="¿Eliminar este usuario?"
          description={`Se eliminará la cuenta de ${deleting.name} junto con sus espacios y reservas. Esto no se puede deshacer. Si tiene reservas activas (propias o en sus espacios), primero deben resolverse.`}
          action={deleteUserAdminAction}
          hiddenFields={{ userId: deleting.id }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function spotStatus(s: AdminDashboardData['spots'][number]) {
  if (s.isArchived) return { label: 'Archivado', className: 'bg-destructive/10 text-destructive' }
  if (s.isExpired) return { label: 'Expirado', className: 'bg-warning/15 text-warning' }
  if (s.isPublished) return { label: 'Publicado', className: 'bg-accent/15 text-accent' }
  return { label: 'Pausado', className: 'bg-muted text-muted-foreground' }
}

function EspaciosTab({ spots }: { spots: AdminDashboardData['spots'] }) {
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)

  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Espacio</th>
              <th className="px-5 py-3 font-medium">Dueño</th>
              <th className="px-5 py-3 font-medium">Comuna</th>
              <th className="px-5 py-3 font-medium">Precio/h</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Reservas</th>
            </tr>
          </thead>
          <tbody>
            {spots.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">{s.title}</span>
                    {!s.isArchived && (
                      <button onClick={() => setDeleting({ id: s.id, title: s.title })} aria-label={`Eliminar ${s.title}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
                        <Trash2 className="size-3.5" /> Eliminar
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.ownerName}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.comuna ?? '—'}</td>
                <td className="px-5 py-3 tabular-nums">${s.price.toLocaleString('es-CL')}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${spotStatus(s).className}`}>
                    {spotStatus(s).label}
                  </span>
                </td>
                <td className="px-5 py-3 tabular-nums">{s.reservationsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col divide-y divide-border sm:hidden">
        {spots.map((s) => (
          <details key={s.id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.title}</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${spotStatus(s).className}`}>
                  {spotStatus(s).label}
                </span>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Dueño</p><p className="truncate">{s.ownerName}</p></div>
              <div><p className="text-xs text-muted-foreground">Comuna</p><p className="truncate">{s.comuna ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Precio/h</p><p className="tabular-nums">${s.price.toLocaleString('es-CL')}</p></div>
              <div><p className="text-xs text-muted-foreground">Reservas</p><p className="tabular-nums">{s.reservationsCount}</p></div>
            </div>
            {!s.isArchived && (
              <button onClick={() => setDeleting({ id: s.id, title: s.title })} aria-label={`Eliminar ${s.title}`} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
                <Trash2 className="size-3.5" /> Eliminar espacio
              </button>
            )}
          </details>
        ))}
      </div>

      {spots.length === 0 && <p className="p-6 text-sm text-muted-foreground">Aún no hay espacios publicados.</p>}
      {deleting && (
        <AdminConfirmModal
          title="¿Eliminar este espacio?"
          description={`Se eliminará "${deleting.title}" de la plataforma. Si tiene una reserva confirmada activa, se archivará en vez de borrarse para no dejar a esa persona sin su reserva.`}
          action={deleteSpotAdminAction}
          hiddenFields={{ spotId: deleting.id }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function ReservasTab({ reservations }: { reservations: AdminDashboardData['activeReservations'] }) {
  const [deleting, setDeleting] = useState<{ id: string; spotTitle: string } | null>(null)

  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Espacio</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Anfitrión</th>
              <th className="px-5 py-3 font-medium">Horario</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Código</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">{r.spotTitle}</span>
                    <button onClick={() => setDeleting({ id: r.id, spotTitle: r.spotTitle })} aria-label={`Eliminar reserva de ${r.spotTitle}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" /> Eliminar
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p>{r.renterName}</p>
                  <p className="text-xs text-muted-foreground">{r.renterEmail}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{r.ownerName}</td>
                <td className="px-5 py-3 text-muted-foreground">{dateTimeFormatter.format(r.startTime)} → {dateTimeFormatter.format(r.endTime)}</td>
                <td className="px-5 py-3 tabular-nums">${r.totalPrice.toLocaleString('es-CL')}</td>
                <td className="px-5 py-3 font-mono text-xs tracking-wide">{r.confirmationCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col divide-y divide-border sm:hidden">
        {reservations.map((r) => (
          <details key={r.id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.spotTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{dateTimeFormatter.format(r.startTime)} → {dateTimeFormatter.format(r.endTime)}</p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Cliente</p><p className="truncate">{r.renterName}</p><p className="truncate text-xs text-muted-foreground">{r.renterEmail}</p></div>
              <div><p className="text-xs text-muted-foreground">Anfitrión</p><p className="truncate">{r.ownerName}</p></div>
              <div><p className="text-xs text-muted-foreground">Precio</p><p className="tabular-nums">${r.totalPrice.toLocaleString('es-CL')}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Código</p><p className="font-mono text-xs tracking-wide">{r.confirmationCode}</p></div>
            </div>
            <button onClick={() => setDeleting({ id: r.id, spotTitle: r.spotTitle })} aria-label={`Eliminar reserva de ${r.spotTitle}`} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
              <Trash2 className="size-3.5" /> Eliminar reserva
            </button>
          </details>
        ))}
      </div>

      {reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <CalendarClock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay reservas activas en este momento.</p>
        </div>
      )}
      {deleting && (
        <AdminConfirmModal
          title="¿Eliminar esta reserva?"
          description={`Se cancelará la reserva en "${deleting.spotTitle}" y el horario quedará libre nuevamente. Esta acción no se puede deshacer.`}
          action={cancelReservationAdminAction}
          hiddenFields={{ reservationId: deleting.id }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function AdministradoresTab({ users, currentUserId }: { users: AdminDashboardData['users']; currentUserId: string }) {
  const admins = users.filter((u) => u.isAdmin)
  const router = useRouter()
  const [promoteState, promoteAction, promotePending] = useActionState(promoteAdminAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (promoteState && 'success' in promoteState) {
      router.refresh()
      formRef.current?.reset()
    }
  }, [promoteState, router])

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_.9fr]">
      <div className="min-w-0 rounded-3xl border border-border bg-card">
        <table className="hidden w-full text-left text-sm sm:table">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Administrador</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <AdminRow key={admin.id} admin={admin} currentUserId={currentUserId} />
            ))}
          </tbody>
        </table>
        <div className="flex flex-col divide-y divide-border sm:hidden">
          {admins.map((admin) => (
            <AdminCard key={admin.id} admin={admin} currentUserId={currentUserId} />
          ))}
        </div>
      </div>
      <div className="min-w-0 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2"><UserPlus className="size-4 text-accent" /><h2 className="text-lg font-semibold">Agregar administrador</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">El correo debe pertenecer a un usuario ya registrado en la plataforma.</p>
        <form ref={formRef} action={promoteAction} className="mt-4 flex flex-col gap-3">
          <input name="email" type="email" required placeholder="correo@ejemplo.com" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          {promoteState && 'error' in promoteState && <p className="text-sm text-destructive">{promoteState.error}</p>}
          {promoteState && 'success' in promoteState && <p className="text-sm text-accent">Administrador agregado.</p>}
          <button type="submit" disabled={promotePending} className="self-start rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{promotePending ? 'Agregando…' : 'Agregar'}</button>
        </form>
      </div>
    </div>
  )
}

function AdminRow({ admin, currentUserId }: { admin: AdminDashboardData['users'][number]; currentUserId: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(demoteAdminAction, undefined)

  useEffect(() => {
    if (state && 'success' in state) router.refresh()
  }, [state, router])

  const canRemove = admin.id !== currentUserId

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-3">
        <p className="font-medium">{admin.name}</p>
        <p className="text-xs text-muted-foreground">{admin.email}</p>
        {state && 'error' in state && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
      </td>
      <td className="px-5 py-3 text-right">
        {canRemove && (
          <form action={formAction}>
            <input type="hidden" name="userId" value={admin.id} />
            <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50">
              <Ban className="size-3.5" /> {pending ? 'Quitando…' : 'Quitar acceso'}
            </button>
          </form>
        )}
      </td>
    </tr>
  )
}

function AdminCard({ admin, currentUserId }: { admin: AdminDashboardData['users'][number]; currentUserId: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(demoteAdminAction, undefined)

  useEffect(() => {
    if (state && 'success' in state) router.refresh()
  }, [state, router])

  const canRemove = admin.id !== currentUserId

  return (
    <div className="p-4">
      <p className="truncate font-medium">{admin.name}</p>
      <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
      {state && 'error' in state && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
      {canRemove && (
        <form action={formAction} className="mt-3">
          <input type="hidden" name="userId" value={admin.id} />
          <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50">
            <Ban className="size-3.5" /> {pending ? 'Quitando…' : 'Quitar acceso'}
          </button>
        </form>
      )}
    </div>
  )
}

type TaskStatus = AdminDashboardData['tasks'][number]['status']

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'Por hacer' },
  { status: 'IN_PROGRESS', label: 'En progreso' },
  { status: 'DONE', label: 'Hecho' },
]

function TareasTab({ tasks, users }: { tasks: AdminDashboardData['tasks']; users: AdminDashboardData['users'] }) {
  const router = useRouter()
  const admins = users.filter((u) => u.isAdmin).map((u) => ({ id: u.id, name: u.name }))
  const doneCount = tasks.filter((t) => t.status === 'DONE').length
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [boardError, setBoardError] = useState<string | null>(null)

  async function moveTo(taskId: string, status: TaskStatus) {
    const formData = new FormData()
    formData.set('taskId', taskId)
    formData.set('status', status)
    const result = await moveTaskAction(undefined, formData)
    if (result && 'error' in result) {
      setBoardError(result.error)
      return
    }
    setBoardError(null)
    router.refresh()
  }

  function handleDrop(status: TaskStatus) {
    setDragOverStatus(null)
    const task = tasks.find((t) => t.id === draggedId)
    if (task && task.status !== status) moveTo(task.id, status)
    setDraggedId(null)
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><ListChecks className="size-4 text-accent" /><h2 className="text-lg font-semibold">Tablero kanban del roadmap</h2></div>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{doneCount} / {tasks.length}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }} />
        </div>
        {boardError && <p className="mt-3 text-sm text-destructive">{boardError}</p>}
      </div>

      {tasks.length === 0 && <p className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">No hay tareas cargadas todavía.</p>}

      {tasks.length > 0 && (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          {TASK_COLUMNS.map((column, columnIndex) => {
            const columnTasks = tasks.filter((t) => t.status === column.status)
            return (
              <div
                key={column.status}
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(column.status) }}
                onDragLeave={() => setDragOverStatus((s) => (s === column.status ? null : s))}
                onDrop={(e) => { e.preventDefault(); handleDrop(column.status) }}
                className={`min-w-0 rounded-3xl border bg-card p-4 transition-colors ${dragOverStatus === column.status ? 'border-accent bg-accent/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-3">
                  <h3 className="text-sm font-semibold">{column.label}</h3>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{columnTasks.length}</span>
                </div>
                <div className="flex min-h-[60px] flex-col gap-2">
                  {columnTasks.length === 0 && <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">Sin tareas acá</p>}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      admins={admins}
                      columnIndex={columnIndex}
                      onDragStart={() => setDraggedId(task.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onMove={(status) => moveTo(task.id, status)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task, admins, columnIndex, onDragStart, onDragEnd, onMove,
}: {
  task: AdminDashboardData['tasks'][number]
  admins: { id: string; name: string }[]
  columnIndex: number
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (status: TaskStatus) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [assignState, assignFormAction] = useActionState(assignTaskAction, undefined)

  useEffect(() => {
    if (assignState && 'success' in assignState) {
      router.refresh()
      setExpanded(false)
    }
  }, [assignState, router])

  function handleAssign(userId: string | null) {
    const formData = new FormData()
    formData.set('taskId', task.id)
    if (userId) formData.set('userId', userId)
    startTransition(() => assignFormAction(formData))
  }

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="cursor-grab rounded-2xl border border-border bg-background p-3 active:cursor-grabbing">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{task.epic}</span>
          <p className="mt-1.5 text-sm">{task.title}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" disabled={columnIndex === 0} onClick={() => onMove(TASK_COLUMNS[columnIndex - 1].status)} aria-label="Mover a la columna anterior" className="rounded-full border border-border p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronLeft className="size-3.5" />
          </button>
          <button type="button" disabled={columnIndex === TASK_COLUMNS.length - 1} onClick={() => onMove(TASK_COLUMNS[columnIndex + 1].status)} aria-label="Mover a la siguiente columna" className="rounded-full border border-border p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          {task.assignedTo ? task.assignedTo.name.split(' ')[0] : 'Asignar'}
          <ChevronDown className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl bg-muted/50 p-2.5">
          {admins.length === 0 && <p className="text-xs text-muted-foreground">No hay otros administradores para asignar todavía.</p>}
          {admins.map((admin) => (
            <button
              key={admin.id}
              type="button"
              onClick={() => handleAssign(admin.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${task.assignedTo?.id === admin.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              {admin.name}
            </button>
          ))}
          {task.assignedTo && (
            <button type="button" onClick={() => handleAssign(null)} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive">
              Quitar
            </button>
          )}
        </div>
      )}

      {assignState && 'error' in assignState && <p className="mt-1.5 text-xs text-destructive">{assignState.error}</p>}
    </div>
  )
}
