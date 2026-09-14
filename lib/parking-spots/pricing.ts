'use server'

import { prisma } from '@/lib/db/prisma'
import { suggestPrice, type PricingResponse } from '@/lib/engines/client'

export type SuggestPriceState = { error: string } | { success: true; result: PricingResponse } | undefined

/**
 * `Date#toISOString()` always renders in UTC, but the pricing engine's peak-hour heuristic
 * needs Chile's actual wall-clock hour — sending UTC would silently misclassify, say, 10pm in
 * Santiago as "madrugada" once it crosses into the next UTC day. This renders the current
 * moment with Santiago's real (DST-aware) offset instead.
 */
function chileLocalIsoString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  const offsetMatch = /GMT([+-]\d+)/.exec(parts.timeZoneName ?? '')
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : -3
  const offset = `${offsetHours >= 0 ? '+' : '-'}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`
  const hour = parts.hour === '24' ? '00' : parts.hour

  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}${offset}`
}

export async function suggestPriceAction(_prevState: SuggestPriceState, formData: FormData): Promise<SuggestPriceState> {
  const comuna = formData.get('comuna')
  const parkingTypeId = formData.get('parkingTypeId')

  if (typeof comuna !== 'string' || !comuna.trim()) {
    return { error: 'Elige una dirección con comuna reconocida para poder sugerir un precio' }
  }
  if (typeof parkingTypeId !== 'string' || !parkingTypeId) {
    return { error: 'Selecciona un tipo de espacio' }
  }

  const parkingType = await prisma.parkingType.findUnique({ where: { id: parkingTypeId } })
  if (!parkingType) {
    return { error: 'Tipo de espacio inválido' }
  }

  const comparableSpots = await prisma.parkingSpot.findMany({
    where: { comuna, isPublished: true },
    select: { pricePerHour: true },
    take: 20,
  })

  const result = await suggestPrice({
    comuna,
    parkingTypeName: parkingType.name,
    comparableSpots: comparableSpots.map((spot) => ({ pricePerHour: spot.pricePerHour })),
    requestedAt: chileLocalIsoString(new Date()),
  })

  if ('error' in result) {
    return { error: result.error }
  }

  return { success: true, result: result.data }
}
