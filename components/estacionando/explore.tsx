'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, CarFront, Check, ChevronDown, Clock3, Heart, List, LocateFixed, Loader2, MapIcon, MapPin, Navigation, Plus, Search } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { rankNearbySpotsAction } from '@/lib/parking-spots/nearby-actions'
import { haversineDistanceMeters } from '@/lib/estacionando/geo'
import type { Spot, View } from '@/lib/estacionando/types'

const SpotMap = dynamic(() => import('./spot-map').then((mod) => mod.SpotMap), { ssr: false })

export type ExploreProps = {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  comuna: string
  setComuna: Dispatch<SetStateAction<string>>
  comunas: string[]
  filtered: Spot[]
  liked: string[]
  toggleLike: (id: string) => void
  onSelect: (spot: Spot) => void
  nav: (view: View) => void
}

type NearbyStatus = 'idle' | 'locating' | 'ranking' | 'ready' | 'error'
type NearbyRank = { distanceMeters: number; durationSeconds: number }

export function Explore({ query, setQuery, comuna, setComuna, comunas, filtered, liked, toggleLike, onSelect, nav }: ExploreProps) {
  const [mode, setMode] = useState<'list' | 'map'>('list')
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('idle')
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [nearbyRanked, setNearbyRanked] = useState<Map<string, NearbyRank> | null>(null)

  const displaySpots = useMemo(() => {
    if (nearbyStatus !== 'ready' || !nearbyRanked) return filtered
    const withRank = filtered.filter((spot) => nearbyRanked.has(spot.id))
    const withoutRank = filtered.filter((spot) => !nearbyRanked.has(spot.id))
    withRank.sort((a, b) => nearbyRanked.get(a.id)!.durationSeconds - nearbyRanked.get(b.id)!.durationSeconds)
    return [...withRank, ...withoutRank]
  }, [filtered, nearbyStatus, nearbyRanked])

  const pins = useMemo(
    () => displaySpots.filter((spot): spot is Spot & { latitude: number; longitude: number } => spot.latitude !== null && spot.longitude !== null).map((spot) => ({ id: spot.id, latitude: spot.latitude, longitude: spot.longitude })),
    [displaySpots],
  )

  function handleToggleNearby() {
    if (nearbyStatus === 'locating' || nearbyStatus === 'ranking' || nearbyStatus === 'ready') {
      setNearbyStatus('idle')
      setNearbyRanked(null)
      setNearbyError(null)
      return
    }

    if (!('geolocation' in navigator)) {
      setNearbyStatus('error')
      setNearbyError('Tu navegador no permite compartir tu ubicación.')
      return
    }

    setNearbyStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const origin = { latitude: position.coords.latitude, longitude: position.coords.longitude }
        let candidates = filtered
          .filter((spot): spot is Spot & { latitude: number; longitude: number } => spot.latitude !== null && spot.longitude !== null)
          .map((spot) => ({ id: spot.id, latitude: spot.latitude, longitude: spot.longitude }))

        if (candidates.length === 0) {
          setNearbyStatus('error')
          setNearbyError('Ningún espacio tiene ubicación registrada todavía.')
          return
        }

        if (candidates.length > 24) {
          candidates = candidates
            .map((candidate) => ({ candidate, dist: haversineDistanceMeters(origin, candidate) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 24)
            .map(({ candidate }) => candidate)
        }

        setNearbyStatus('ranking')
        const result = await rankNearbySpotsAction(origin, candidates)
        if ('error' in result) {
          setNearbyStatus('error')
          setNearbyError(result.error)
          return
        }

        setNearbyRanked(new Map(result.ranked.map((r) => [r.id, { distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds }])))
        setNearbyStatus('ready')
      },
      () => {
        setNearbyStatus('error')
        setNearbyError('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          <span className="absolute left-[8%] top-[15%] size-2 rounded-full bg-accent/20" />
          <span className="absolute left-[16%] top-[58%] size-1.5 rounded-full bg-accent/15" />
          <span className="absolute left-[36%] top-[10%] size-1 rounded-full bg-accent/25" />
          <span className="absolute right-[30%] top-[22%] size-2.5 rounded-full bg-accent/10" />
          <span className="absolute right-[9%] top-[68%] size-1.5 rounded-full bg-accent/20" />
          <span className="absolute right-[22%] top-[85%] size-1 rounded-full bg-accent/15" />
        </div>
        <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-12 lg:px-10 lg:pb-14 lg:pt-16">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent bg-background px-3 py-1.5 text-xs font-medium"><span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-accent" /></span> {filtered.length} {filtered.length === 1 ? 'espacio disponible' : 'espacios disponibles'} ahora</div>
              <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.075em] sm:text-6xl lg:text-8xl">Tu lugar,<br /><span className="text-accent">más cerca.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">Encuentra estacionamientos de personas reales, reserva en segundos y llega tranquilo.</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background p-2 shadow-lg">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5"><Search className="size-5 text-muted-foreground" /><input aria-label="Buscar ubicación" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="¿Dónde necesitas estacionar?" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2 border-t border-border/70 px-2 pt-2 text-xs"><div className="flex gap-2 rounded-xl px-3 py-2.5"><Clock3 className="size-4 text-muted-foreground" /><span><b className="block">Hoy</b><span className="text-muted-foreground">Ahora</span></span></div><div className="flex gap-2 rounded-xl px-3 py-2.5"><CarFront className="size-4 text-muted-foreground" /><span><b className="block">1 vehículo</b><span className="text-muted-foreground">Auto</span></span></div></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-9 lg:px-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">Espacios compartidos por tu comunidad</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">Explora en Santiago</h2></div><div className="flex flex-wrap items-center gap-2">{comunas.length > 0 && <ComunaFilter comuna={comuna} setComuna={setComuna} comunas={comunas} />}<button onClick={handleToggleNearby} aria-pressed={nearbyStatus === 'ready'} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition ${nearbyStatus === 'ready' ? 'border-accent bg-accent/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}>{nearbyStatus === 'locating' || nearbyStatus === 'ranking' ? <Loader2 className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" />} {nearbyStatus === 'locating' ? 'Ubicándote…' : nearbyStatus === 'ranking' ? 'Calculando…' : 'Cerca de mí'}</button><div className="flex rounded-full border border-border p-1"><button onClick={() => setMode('list')} aria-pressed={mode === 'list'} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${mode === 'list' ? 'bg-muted' : 'text-muted-foreground'}`}><List className="size-3.5" /> Lista</button><button onClick={() => setMode('map')} aria-pressed={mode === 'map'} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${mode === 'map' ? 'bg-muted' : 'text-muted-foreground'}`}><MapIcon className="size-3.5" /> Mapa</button></div><button onClick={() => nav('publish')} className="hidden items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted sm:flex"><Plus className="size-4" /> Publicar mi espacio</button></div></div>
        {nearbyStatus === 'error' && nearbyError && <p className="mb-4 flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="size-3.5 shrink-0" /> {nearbyError}</p>}
        {filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{query ? 'No encontramos resultados' : 'Aún no hay espacios publicados'}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{query ? 'Prueba con otra ubicación o borra tu búsqueda.' : 'Sé el primero en compartir tu estacionamiento con la comunidad.'}</p>
            {!query && <button onClick={() => nav('publish')} className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Publicar mi espacio</button>}
          </div>
        ) : mode === 'map' ? (
          pins.length > 0 ? (
            <SpotMap pins={pins} onSelectPin={(id) => { const spot = displaySpots.find((item) => item.id === id); if (spot) onSelect(spot) }} className="h-[420px] w-full min-w-0" />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
              <MapIcon className="size-8 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Ningún espacio tiene ubicación en el mapa todavía</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Prueba con la vista de lista mientras tanto.</p>
            </div>
          )
        ) : (
          <div className="grid min-w-0 items-stretch gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">{displaySpots.map((spot) => { const rank = nearbyRanked?.get(spot.id); return <article key={spot.id} className="group flex h-full min-w-0 flex-col cursor-pointer rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-md" onClick={() => onSelect(spot)}><div className="relative aspect-[1.18] overflow-hidden rounded-xl bg-muted"><img src={spot.image} alt={spot.title} className="size-full object-cover transition duration-500 group-hover:scale-105" /><button aria-label={`Guardar ${spot.title}`} onClick={(event) => { event.stopPropagation(); toggleLike(spot.id) }} className="absolute right-3 top-3 rounded-full bg-background/85 p-2.5"><Heart className={`size-4 ${liked.includes(spot.id) ? 'fill-accent text-accent' : ''}`} /></button><span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium">{spot.type}</span></div><div className="flex flex-1 flex-col pt-3"><h3 className="truncate font-medium">{spot.title}</h3><p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" />{spot.comuna ?? spot.area}</p><div className="mt-auto pt-2">{rank && <p className="mb-1 flex items-center gap-1 text-xs font-medium text-accent"><Navigation className="size-3 shrink-0" /> {Math.round(rank.durationSeconds / 60)} min · {(rank.distanceMeters / 1000).toFixed(1)} km</p>}<p className="text-sm tabular-nums"><b>${spot.price.toLocaleString('es-CL')}</b> <span className="text-muted-foreground">/ hora</span></p></div></div></article> })}</div>
        )}
      </section>
      <section className="hidden border-t border-border bg-primary px-5 py-14 text-primary-foreground lg:px-10"><div className="mx-auto max-w-[1440px]"><p className="text-sm text-muted-foreground">Para todos los días</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Un espacio vacío puede<br />ser el lugar de alguien.</h2><button onClick={() => nav('publish')} className="mt-6 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">Publica tu estacionamiento <ArrowRight className="size-4" /></button></div></section>
    </>
  )
}

function ComunaFilter({ comuna, setComuna, comunas }: { comuna: string; setComuna: (value: string) => void; comunas: string[] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(value: string) {
    setComuna(value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition ${comuna ? 'border-accent bg-accent/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}>
        <MapPin className="size-3.5" /> {comuna || 'Todas las comunas'} <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 z-20 mt-1.5 max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-background py-1.5 shadow-lg">
          <button type="button" role="option" aria-selected={!comuna} onClick={() => select('')} className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted ${!comuna ? 'font-medium text-accent' : ''}`}>Todas las comunas {!comuna && <Check className="size-3.5" />}</button>
          {comunas.map((item) => (
            <button key={item} type="button" role="option" aria-selected={comuna === item} onClick={() => select(item)} className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-muted ${comuna === item ? 'font-medium text-accent' : ''}`}>
              <span className="truncate">{item}</span> {comuna === item && <Check className="size-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
