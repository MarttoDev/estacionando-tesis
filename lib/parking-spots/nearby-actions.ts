'use server'

import { rankNearbySpots, type GeoPoint, type RankedCandidate, type RouteCandidate } from '@/lib/engines/client'

export type NearbyState = { error: string } | { success: true; ranked: RankedCandidate[] }

export async function rankNearbySpotsAction(origin: GeoPoint, candidates: RouteCandidate[]): Promise<NearbyState> {
  if (candidates.length === 0) {
    return { success: true, ranked: [] }
  }

  const result = await rankNearbySpots(origin, candidates)
  if ('error' in result) {
    return { error: result.error }
  }

  return { success: true, ranked: result.data.ranked }
}
