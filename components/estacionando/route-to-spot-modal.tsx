'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle, ExternalLink, Loader2, Navigation, X } from 'lucide-react'
import { getDirectionsAction } from '@/lib/reservations/route-actions'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import type { DirectionsResponse } from '@/lib/engines/client'

const SpotMap = dynamic(() => import('./spot-map').then((mod) => mod.SpotMap), { ssr: false })

type Status = 'locating' | 'locating-error' | 'loading-route' | 'route-error' | 'ready'

export function RouteToSpotModal({ spot, onClose }: { spot: { title: string; latitude: number; longitude: number }; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('locating')
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null)
  const [route, setRoute] = useState<DirectionsResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useLockBodyScroll(true)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('locating-error')
      setErrorMessage('Tu navegador no permite compartir tu ubicación.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => {
        setStatus('locating-error')
        setErrorMessage('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])

  useEffect(() => {
    if (!origin) return
    let cancelled = false
    setStatus('loading-route')

    getDirectionsAction(origin, { latitude: spot.latitude, longitude: spot.longitude })
      .then((result) => {
        if (cancelled) return
        if ('error' in result) {
          setStatus('route-error')
          setErrorMessage(result.error)
          return
        }
        setRoute(result.result)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('route-error')
        setErrorMessage('No se pudo calcular la ruta.')
      })

    return () => {
      cancelled = true
    }
  }, [origin, spot.latitude, spot.longitude])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`

  const pins = [
    ...(origin ? [{ id: 'origin', latitude: origin.latitude, longitude: origin.longitude, kind: 'origin' as const }] : []),
    { id: 'destination', latitude: spot.latitude, longitude: spot.longitude },
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Ruta hacia</p>
            <h2 className="truncate text-lg font-semibold">{spot.title}</h2>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="shrink-0 rounded-full border border-border p-2"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          {(status === 'locating' || status === 'loading-route') && (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-accent" />
              {status === 'locating' ? 'Obteniendo tu ubicación…' : 'Calculando la mejor ruta…'}
            </div>
          )}
          {(status === 'locating-error' || status === 'route-error') && (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <AlertTriangle className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          )}
          {status === 'ready' && route && (
            <>
              <SpotMap pins={pins} route={{ geometry: route.geometry }} className="h-56 w-full min-w-0" />
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted p-4 text-sm">
                <Navigation className="size-5 shrink-0 text-accent" />
                <div>
                  <p className="font-medium">{(route.distanceMeters / 1000).toFixed(1)} km · {Math.round(route.durationSeconds / 60)} min aprox.</p>
                  <p className="text-xs text-muted-foreground">Estimado con tráfico normal.</p>
                </div>
              </div>
            </>
          )}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted">
            Abrir en Google Maps <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
