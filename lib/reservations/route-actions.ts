'use server'

import { getDirections, type DirectionsResponse } from '@/lib/engines/client'

export type DirectionsState = { error: string } | { success: true; result: DirectionsResponse }

export async function getDirectionsAction(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<DirectionsState> {
  const result = await getDirections(origin, destination)
  if ('error' in result) return { error: result.error }
  return { success: true, result: result.data }
}
