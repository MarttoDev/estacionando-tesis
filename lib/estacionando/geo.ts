export type LatLng = { latitude: number; longitude: number }

/** Straight-line distance in meters — used only to pre-filter candidates before asking the
 * route engine, since Mapbox's Matrix API caps a request at 25 coordinates total. */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
