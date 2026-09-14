import { prisma } from '@/lib/db/prisma'
import { notifyChange } from '@/lib/realtime/notify'

/**
 * Deletes a spot outright when it has no active confirmed reservation. Otherwise archives it
 * instead (unpublishes + stamps archivedAt) so the pending reservation's history survives —
 * only the still-free future availability windows are purged.
 */
export async function deleteOrArchiveSpot(spotId: string) {
  const now = new Date()
  const activeReservations = await prisma.reservation.count({
    where: { spotId, status: 'CONFIRMED', endTime: { gt: now } },
  })

  if (activeReservations === 0) {
    await prisma.parkingSpot.delete({ where: { id: spotId } })
  } else {
    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { spotId, endTime: { gt: now }, reservations: { none: {} } } }),
      prisma.parkingSpot.update({ where: { id: spotId }, data: { isPublished: false, archivedAt: now } }),
    ])
  }

  await notifyChange('parking_spots')
}
