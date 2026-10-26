import { prisma } from '@/lib/db/prisma'
import type { ReservationStatus } from '@prisma/client'

export type ReservationView = {
  id: string
  spotId: string
  spotTitle: string
  spotArea: string
  spotLatitude: number | null
  spotLongitude: number | null
  startTime: Date
  endTime: Date
  totalPrice: number
  status: ReservationStatus
  confirmationCode: string
  payment: { authorizationCode: string | null; cardLastDigits: string | null; paidAt: Date | null } | null
}

export async function getUserReservations(userId: string): Promise<ReservationView[]> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: { spot: true, payment: { select: { authorizationCode: true, cardLastDigits: true, paidAt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return reservations.map((reservation) => ({
    id: reservation.id,
    spotId: reservation.spotId,
    spotTitle: reservation.spot.title,
    spotArea: reservation.spot.area,
    spotLatitude: reservation.spot.latitude,
    spotLongitude: reservation.spot.longitude,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    confirmationCode: reservation.confirmationCode,
    payment: reservation.payment,
  }))
}
