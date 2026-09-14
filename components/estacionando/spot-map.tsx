'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const SANTIAGO_CENTER: [number, number] = [-70.6693, -33.4489]
const ACCENT_COLOR = 'oklch(0.55 0.19 255)'
const ORIGIN_COLOR = '#111827'
const ROUTE_LINE_COLOR = '#3b5fe0'
const ROUTE_SOURCE_ID = 'estacionando-route'
const ROUTE_LAYER_ID = 'estacionando-route-line'
const MAP_STYLES = { light: 'mapbox://styles/mapbox/light-v11', dark: 'mapbox://styles/mapbox/dark-v11' }

if (!mapboxgl.accessToken) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
}

function currentMapStyle() {
  const theme = document.documentElement.getAttribute('data-theme')
  const isDark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  return isDark ? MAP_STYLES.dark : MAP_STYLES.light
}

function parseRouteGeometry(geometry: string): [number, number][] {
  return geometry
    .split(';')
    .filter(Boolean)
    .map((pair) => {
      const [lng, lat] = pair.split(',').map(Number)
      return [lng, lat] as [number, number]
    })
}

function syncRouteLayer(map: mapboxgl.Map, route: RouteLine | null | undefined) {
  const coordinates = route ? parseRouteGeometry(route.geometry) : null
  const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined

  if (!coordinates || coordinates.length < 2) {
    if (source) {
      map.removeLayer(ROUTE_LAYER_ID)
      map.removeSource(ROUTE_SOURCE_ID)
    }
    return
  }

  const geojson = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } }

  if (source) {
    source.setData(geojson)
  } else {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTE_LINE_COLOR, 'line-width': 4, 'line-opacity': 0.85 },
    })
  }
}

export type MapPinData = { id: string; latitude: number; longitude: number; kind?: 'default' | 'origin' }
export type RouteLine = { geometry: string }

export function SpotMap({
  pins,
  route,
  onSelectPin,
  className = 'h-64 w-full',
  zoom = 14,
}: {
  pins: MapPinData[]
  route?: RouteLine | null
  onSelectPin?: (id: string) => void
  className?: string
  zoom?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const routeRef = useRef<RouteLine | null | undefined>(route)
  routeRef.current = route

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxgl.accessToken) return

    const center: [number, number] = pins.length > 0 ? [pins[0].longitude, pins[0].latitude] : SANTIAGO_CENTER

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: currentMapStyle(),
      center,
      zoom: pins.length > 0 ? zoom : 11,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => syncRouteLayer(map, routeRef.current))
    map.on('style.load', () => syncRouteLayer(map, routeRef.current))
    mapRef.current = map

    const observer = new MutationObserver(() => map.setStyle(currentMapStyle()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncRouteLayer(map, route)
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = pins.map((pin) => {
      const marker = new mapboxgl.Marker({ color: pin.kind === 'origin' ? ORIGIN_COLOR : ACCENT_COLOR }).setLngLat([pin.longitude, pin.latitude]).addTo(map)
      if (onSelectPin) {
        marker.getElement().style.cursor = 'pointer'
        marker.getElement().addEventListener('click', () => onSelectPin(pin.id))
      }
      return marker
    })

    const routeCoordinates = route ? parseRouteGeometry(route.geometry) : []
    if (pins.length > 1 || routeCoordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      pins.forEach((pin) => bounds.extend([pin.longitude, pin.latitude]))
      routeCoordinates.forEach((coordinate) => bounds.extend(coordinate))
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 })
    } else if (pins.length === 1) {
      map.easeTo({ center: [pins[0].longitude, pins[0].latitude], zoom })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, route, onSelectPin, zoom])

  if (!mapboxgl.accessToken) return null

  return <div ref={containerRef} className={`overflow-hidden rounded-2xl border border-border ${className}`} />
}
