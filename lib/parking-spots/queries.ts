import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { subtractBusyRanges } from './free-ranges'
import type { Spot } from '@/lib/estacionando/types'

const PLACEHOLDER_IMAGE = '/placeholder.svg'

/** The next full hour from `date` — e.g. 14:05 -> 15:00, 14:00 -> 15:00. Used so a window
 *  that started in the past never offers "now" itself (already partly elapsed) as a start. */
function nextFullHour(date: Date): Date {
  const next = new Date(date)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  return next
}

export async function getPublishedSpots(): Promise<Spot[]> {
  const now = new Date()
  const earliestBookable = nextFullHour(now)

  const spots = await prisma.parkingSpot.findMany({
    where: {
      isPublished: true,
      availabilities: { some: { endTime: { gt: now } } },
    },
    include: {
      parkingType: true,
      availabilities: { where: { endTime: { gt: now } }, orderBy: { startTime: 'asc' } },
      reservations: { where: { status: 'CONFIRMED', endTime: { gt: now } }, select: { startTime: true, endTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const busyRanges = (spot: (typeof spots)[number]) => spot.reservations.map((r) => ({ start: r.startTime, end: r.endTime }))

  return spots
    .map((spot) => {
      const busy = busyRanges(spot)
      const availableWindows = spot.availabilities.flatMap((availability) =>
        subtractBusyRanges(
          { start: availability.startTime < earliestBookable ? earliestBookable : availability.startTime, end: availability.endTime },
          busy,
        ).map((segment, index) => ({
          id: `${availability.id}-${index}`,
          availabilityId: availability.id,
          startTime: segment.start,
          endTime: segment.end,
        })),
      )

      return {
        id: spot.id,
        title: spot.title,
        area: spot.area,
        comuna: spot.comuna,
        price: spot.pricePerHour,
        type: spot.parkingType.name,
        image: spot.imageUrl ?? PLACEHOLDER_IMAGE,
        latitude: spot.latitude,
        longitude: spot.longitude,
        availableWindows,
      }
    })
    .filter((spot) => spot.availableWindows.length > 0)
}

export const getParkingTypes = unstable_cache(
  () => prisma.parkingType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ['parking-types'],
  { revalidate: 300 },
)

export type OwnerSpot = {
  id: string
  title: string
  area: string
  comuna: string | null
  price: number
  type: string
  parkingTypeId: string
  image: string
  latitude: number | null
  longitude: number | null
  isPublished: boolean
  isArchived: boolean
  upcomingWindowCount: number
  totalReservationCount: number
  activeReservationCount: number
}

export async function getOwnerSpots(ownerId: string): Promise<OwnerSpot[]> {
  const now = new Date()

  const spots = await prisma.parkingSpot.findMany({
    where: { ownerId },
    include: {
      parkingType: true,
      _count: { select: { reservations: true } },
      availabilities: { where: { endTime: { gt: now } }, select: { id: true } },
      reservations: { where: { status: 'CONFIRMED', endTime: { gt: now } }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return spots.map((spot) => ({
    id: spot.id,
    title: spot.title,
    area: spot.area,
    comuna: spot.comuna,
    price: spot.pricePerHour,
    type: spot.parkingType.name,
    parkingTypeId: spot.parkingTypeId,
    image: spot.imageUrl ?? PLACEHOLDER_IMAGE,
    latitude: spot.latitude,
    longitude: spot.longitude,
    isPublished: spot.isPublished,
    isArchived: spot.archivedAt !== null,
    upcomingWindowCount: spot.availabilities.length,
    totalReservationCount: spot._count.reservations,
    activeReservationCount: spot.reservations.length,
  }))
}
