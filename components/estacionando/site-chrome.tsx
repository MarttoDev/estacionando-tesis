'use client'

import { useActionState, useEffect, useMemo, useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import { CalendarDays, Clock3, LockKeyhole, Menu, Plus, Search, Shield, ShieldCheck, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import { MobileMenu } from './mobile-menu'
import { SiteFooter } from './site-footer'
import { ThemeToggle } from './theme-toggle'
import { AvailabilityPicker, type AvailabilityValue } from './availability-picker'

const SpotMap = dynamic(() => import('./spot-map').then((mod) => mod.SpotMap), { ssr: false })
import { createReservationAction } from '@/lib/reservations/actions'
import { computeAvailabilityRange, formatWindowShort, toDateIso } from '@/lib/estacionando/format'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import type { AvailabilityWindow, Spot, View } from '@/lib/estacionando/types'
import type { SessionUser } from '@/lib/auth/types'

type SiteChromeProps = { view: View; nav: (view: View) => void; selected: Spot | null; closeSpot: () => void; onReserved: () => void; user: SessionUser | null; children: ReactNode }

export function SiteChrome({ view, nav, selected, closeSpot, onReserved, user, children }: SiteChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  function navAndClose(next: View) {
    nav(next)
    setMenuOpen(false)
  }

  return <>
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10"><button onClick={() => nav('explore')} className="flex items-center gap-3"><BrandMark /><span className="text-lg font-semibold tracking-[-0.04em]">estacionando<span className="text-accent">.</span></span></button><nav className="hidden items-center gap-1 text-sm md:flex">{([['explore', 'Explorar'], ['bookings', 'Mis reservas'], ['publish', 'Publicar espacio'], ['profile', 'Perfil']] as const).map(([key, label]) => <button key={key} onClick={() => nav(key)} className={`rounded-full px-4 py-2 transition ${view === key ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</nav><div className="flex items-center gap-2"><div className="hidden items-center gap-2 md:flex"><ThemeToggle />{user?.isAdmin && <Link href="/admin" className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-muted"><Shield className="size-4" /><span className="hidden sm:inline">Panel admin</span></Link>}{user ? <button onClick={() => nav('profile')} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-muted">{user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="size-4 rounded-full object-cover" /> : <UserRound className="size-4" />}<span className="hidden sm:inline">{user.name.split(' ')[0]}</span></button> : <Link href="/login" className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-muted"><UserRound className="size-4" /><span className="hidden sm:inline">Iniciar sesión</span></Link>}</div><button aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="rounded-full border border-border p-2.5 md:hidden"><Menu className="size-4" /></button></div></div></header>
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
        <span className="text-sm font-medium text-muted-foreground">Tema</span>
        <ThemeToggle />
      </div>
      {user?.isAdmin && (
        <Link href="/admin" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
          <Shield className="size-4" /> Panel admin
        </Link>
      )}
      {user ? (
        <button onClick={() => navAndClose('profile')} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="size-6 rounded-full object-cover" /> : <UserRound className="size-4" />}
          {user.name}
        </button>
      ) : (
        <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
          <UserRound className="size-4" /> Iniciar sesión
        </Link>
      )}
    </MobileMenu>
    {children}
    <MobileNav view={view} nav={nav} />
    {selected && <SpotDialog spot={selected} close={closeSpot} onReserved={onReserved} />}
    <SiteFooter />
  </>
}

function MobileNav({ view, nav }: Pick<SiteChromeProps, 'view' | 'nav'>) { return <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur md:hidden">{([['explore', Search], ['bookings', CalendarDays], ['publish', Plus], ['profile', UserRound]] as const).map(([key, Icon]) => <button key={key} aria-label={key} onClick={() => nav(key)} className={`rounded-full p-3 ${view === key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}><Icon className="size-4" /></button>)}</div> }

function segmentToRange(segment: AvailabilityWindow | undefined): AvailabilityValue {
  if (!segment) return { startDate: '', startHour: 0, endDate: '', endHour: 0 }
  return {
    startDate: toDateIso(segment.startTime),
    startHour: segment.startTime.getHours(),
    endDate: toDateIso(segment.endTime),
    endHour: segment.endTime.getHours(),
  }
}

function SpotDialog({ spot, close, onReserved }: { spot: Spot; close: () => void; onReserved: () => void }) {
  const [state, formAction, pending] = useActionState(createReservationAction, undefined)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const segment = spot.availableWindows[segmentIndex]
  const [range, setRange] = useState<AvailabilityValue>(() => segmentToRange(segment))
  const [clientError, setClientError] = useState<string | null>(null)
  const pins = useMemo(() => (spot.latitude !== null && spot.longitude !== null ? [{ id: spot.id, latitude: spot.latitude, longitude: spot.longitude }] : []), [spot])

  useLockBodyScroll(true)

  useEffect(() => {
    if (state && 'success' in state) onReserved()
  }, [state, onReserved])

  useEffect(() => {
    setRange(segmentToRange(spot.availableWindows[segmentIndex]))
    setClientError(null)
  }, [segmentIndex, spot.availableWindows])

  if (!segment) {
    return <div className="fixed inset-0 z-30 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={close}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><p className="text-sm text-muted-foreground">No hay horarios disponibles por ahora.</p><button onClick={close} className="mt-4 rounded-full border border-border px-5 py-3 text-sm font-medium">Cerrar</button></div></div>
  }

  const { start, end } = computeAvailabilityRange(range.startDate, range.startHour, range.endDate, range.endHour)
  const startDate = new Date(start)
  const endDate = new Date(end)
  const hours = Math.max(0, (endDate.getTime() - startDate.getTime()) / 3_600_000)
  const totalPrice = Math.round(hours * spot.price)
  const displayError = clientError ?? (state && 'error' in state ? state.error : null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (endDate <= startDate) {
      event.preventDefault()
      setClientError('La hora de término debe ser posterior a la de inicio')
      return
    }
    if (startDate < segment.startTime || endDate > segment.endTime) {
      event.preventDefault()
      setClientError('El horario elegido debe estar dentro del rango disponible')
      return
    }
    setClientError(null)
  }

  return <div className="fixed inset-0 z-30 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={close}><div role="dialog" aria-modal="true" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="relative h-36 shrink-0 sm:h-52"><img src={spot.image} alt={spot.title} className="size-full object-cover" /><button aria-label="Cerrar" onClick={close} className="absolute right-4 top-4 rounded-full bg-background/90 p-2"><X className="size-4" /></button></div><div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6"><div><h2 className="text-xl font-semibold tracking-[-0.05em] sm:text-2xl">{spot.title}</h2><p className="mt-1 text-sm text-muted-foreground">{spot.area}</p></div>{pins.length > 0 && <SpotMap pins={pins} className="mt-4 h-40 w-full min-w-0" zoom={15} />}<div className="my-4 grid grid-cols-3 border-y border-border py-2.5 text-center text-xs sm:my-5 sm:py-4"><span><ShieldCheck className="mx-auto mb-1 size-4 text-accent" />Verificado</span><span><Clock3 className="mx-auto mb-1 size-4 text-accent" />24/7</span><span><LockKeyhole className="mx-auto mb-1 size-4 text-accent" />Privado</span></div>
    {spot.availableWindows.length > 1 && (
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Rangos disponibles</p>
        <div className="flex flex-wrap gap-2">
          {spot.availableWindows.map((window, index) => (
            <button key={window.id} type="button" onClick={() => setSegmentIndex(index)} className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${index === segmentIndex ? 'border-accent bg-accent/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {formatWindowShort(window.startTime, window.endTime)}
            </button>
          ))}
        </div>
      </div>
    )}
    <p className="mb-2 text-sm font-medium">Elige tu horario</p>
    <AvailabilityPicker value={range} onChange={setRange} minDate={toDateIso(segment.startTime)} maxDate={toDateIso(segment.endTime)} />
    {displayError && <p className="mt-3 text-sm text-destructive">{displayError}</p>}
    <form action={formAction} onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <input type="hidden" name="availabilityId" value={segment.availabilityId} />
      <input type="hidden" name="startTime" value={start} />
      <input type="hidden" name="endTime" value={end} />
      <div className="min-w-0">
        <p className="text-xl font-semibold tabular-nums">${totalPrice.toLocaleString('es-CL')}</p>
        <p className="text-xs tabular-nums text-muted-foreground">{hours}h · ${spot.price.toLocaleString('es-CL')} / hora</p>
      </div>
      <button type="submit" disabled={pending || hours <= 0} className="w-full shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50 sm:w-auto">{pending ? 'Reservando…' : 'Reservar lugar'}</button>
    </form>
  </div></div></div>
}
