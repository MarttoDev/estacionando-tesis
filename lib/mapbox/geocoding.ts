export type GeocodingSuggestion = { id: string; placeName: string; comuna: string | null; latitude: number; longitude: number }

type MapboxContextEntry = { id: string; text: string }
type MapboxFeature = { id: string; place_name: string; place_type: string[]; text: string; center: [number, number]; context?: MapboxContextEntry[] }

function extractComuna(feature: MapboxFeature): string | null {
  const context = feature.context ?? []
  const byPrefix = (prefix: string) => context.find((entry) => entry.id.startsWith(prefix))?.text ?? null

  if (feature.place_type.includes('place')) return feature.text
  return byPrefix('place') ?? byPrefix('locality') ?? byPrefix('neighborhood') ?? null
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodingSuggestion[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token || !query.trim()) return []

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
  url.searchParams.set('access_token', token)
  url.searchParams.set('country', 'CL')
  url.searchParams.set('language', 'es')
  url.searchParams.set('types', 'address,place,neighborhood,locality')
  url.searchParams.set('limit', '5')

  const response = await fetch(url, { signal })
  if (!response.ok) return []

  const data = await response.json()
  const features: MapboxFeature[] = Array.isArray(data.features) ? data.features : []

  return features.map((feature) => ({
    id: feature.id,
    placeName: feature.place_name,
    comuna: extractComuna(feature),
    longitude: feature.center[0],
    latitude: feature.center[1],
  }))
}
