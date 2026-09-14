const ENGINES_URL = process.env.ENGINES_URL ?? 'http://localhost:8081'

export type ComparableSpot = { pricePerHour: number }
export type OccupancyStats = { bookedHours: number; availableHours: number }

export type PricingRequest = {
  comuna: string
  parkingTypeName: string
  currentPricePerHour?: number
  comparableSpots?: ComparableSpot[]
  occupancy?: OccupancyStats
  requestedAt?: string
}

export type PriceFactor = { label: string; adjustmentPercent: number }

export type PricingResponse = {
  suggestedPricePerHour: number
  minPricePerHour: number
  maxPricePerHour: number
  basePricePerHour: number
  factors: PriceFactor[]
  explanation: string
}

export type GeoPoint = { latitude: number; longitude: number }
export type RouteCandidate = { id: string; latitude: number; longitude: number }
export type RankedCandidate = { id: string; distanceMeters: number; durationSeconds: number }
export type RankResponse = { ranked: RankedCandidate[] }

export type DirectionsStep = { instruction: string; distanceMeters: number; durationSeconds: number }
export type DirectionsResponse = { distanceMeters: number; durationSeconds: number; geometry: string; steps: DirectionsStep[] }

export type EngineResult<T> = { data: T } | { error: string }

async function callEngine<T>(path: string, body: unknown): Promise<EngineResult<T>> {
  try {
    const response = await fetch(`${ENGINES_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      return { error: (payload && typeof payload.message === 'string' ? payload.message : null) ?? 'El servicio no pudo procesar la solicitud' }
    }

    return { data: (await response.json()) as T }
  } catch {
    return { error: 'No se pudo conectar con el servicio de motores' }
  }
}

export function suggestPrice(request: PricingRequest) {
  return callEngine<PricingResponse>('/api/pricing/suggest', request)
}

export function rankNearbySpots(origin: GeoPoint, candidates: RouteCandidate[], profile = 'driving') {
  return callEngine<RankResponse>('/api/route/rank', { origin, candidates, profile })
}

export function getDirections(origin: GeoPoint, destination: GeoPoint, profile = 'driving') {
  return callEngine<DirectionsResponse>('/api/route/directions', { origin, destination, profile })
}
