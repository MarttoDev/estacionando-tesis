import { prisma } from '@/lib/db/prisma'
import type { ReservationStatus, ReviewDirection, ReviewStatus } from '@prisma/client'

export type ReviewView = {
  id: string
  direction: ReviewDirection
  rating: number
  comment: string | null
  authorId: string
  targetUserId: string
  status: ReviewStatus
  removalReason: string | null
  appealMessage: string | null
}

export type ReservationView = {
  id: string
  spotId: string
  spotTitle: string
  spotArea: string
  spotLatitude: number | null
  spotLongitude: number | null
  hostId: string
  hostName: string
  renterId: string
  renterName: string
  startTime: Date
  endTime: Date
  totalPrice: number
  status: ReservationStatus
  confirmationCode: string
  payment: { authorizationCode: string | null; cardLastDigits: string | null; paidAt: Date | null } | null
  reviews: ReviewView[]
}

function mapReview(review: {
  id: string
  direction: ReviewDirection
  rating: number
  comment: string | null
  authorId: string
  targetUserId: string
  status: ReviewStatus
  removalReason: string | null
  appealMessage: string | null
}): ReviewView {
  return {
    id: review.id,
    direction: review.direction,
    rating: review.rating,
    comment: review.comment,
    authorId: review.authorId,
    targetUserId: review.targetUserId,
    status: review.status,
    removalReason: review.removalReason,
    appealMessage: review.appealMessage,
  }
}

const RENTER_SELECT = { select: { id: true, name: true } } as const

export async function getUserReservations(userId: string): Promise<ReservationView[]> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      spot: { include: { owner: RENTER_SELECT } },
      user: RENTER_SELECT,
      reviews: true,
      payment: { select: { authorizationCode: true, cardLastDigits: true, paidAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reservations.map((reservation) => ({
    id: reservation.id,
    spotId: reservation.spotId,
    spotTitle: reservation.spot.title,
    spotArea: reservation.spot.area,
    spotLatitude: reservation.spot.latitude,
    spotLongitude: reservation.spot.longitude,
    hostId: reservation.spot.owner.id,
    hostName: reservation.spot.owner.name,
    renterId: reservation.user.id,
    renterName: reservation.user.name,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    confirmationCode: reservation.confirmationCode,
    payment: reservation.payment,
    reviews: reservation.reviews.map(mapReview),
  }))
}

export async function getHostReservations(ownerId: string): Promise<ReservationView[]> {
  const reservations = await prisma.reservation.findMany({
    where: { spot: { ownerId } },
    include: {
      spot: { include: { owner: RENTER_SELECT } },
      user: RENTER_SELECT,
      reviews: true,
      payment: { select: { authorizationCode: true, cardLastDigits: true, paidAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reservations.map((reservation) => ({
    id: reservation.id,
    spotId: reservation.spotId,
    spotTitle: reservation.spot.title,
    spotArea: reservation.spot.area,
    spotLatitude: reservation.spot.latitude,
    spotLongitude: reservation.spot.longitude,
    hostId: reservation.spot.owner.id,
    hostName: reservation.spot.owner.name,
    renterId: reservation.user.id,
    renterName: reservation.user.name,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    confirmationCode: reservation.confirmationCode,
    payment: reservation.payment,
    reviews: reservation.reviews.map(mapReview),
  }))
}
