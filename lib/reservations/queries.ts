import { prisma } from '@/lib/db/prisma'
import type { ReservationStatus } from '@prisma/client'

export type ReservationView = {
  id: string
  spotTitle: string
  spotArea: string
  spotLatitude: number | null
  spotLongitude: number | null
  startTime: Date
  endTime: Date
  totalPrice: number
  status: ReservationStatus
  confirmationCode: string
}

export async function getUserReservations(userId: string): Promise<ReservationView[]> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: { spot: true },
    orderBy: { createdAt: 'desc' },
  })

  return reservations.map((reservation) => ({
    id: reservation.id,
    spotTitle: reservation.spot.title,
    spotArea: reservation.spot.area,
    spotLatitude: reservation.spot.latitude,
    spotLongitude: reservation.spot.longitude,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    confirmationCode: reservation.confirmationCode,
  }))
}
