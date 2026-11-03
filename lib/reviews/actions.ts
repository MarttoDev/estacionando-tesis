'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { notifyChange } from '@/lib/realtime/notify'
import { notifyUser } from '@/lib/notifications/notify'
import { appealReviewSchema, createReviewSchema } from './schemas'

export type ReviewActionState = { error: string } | { success: true } | undefined

export async function createReviewAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para calificar' }
  }

  const reservationId = formData.get('reservationId')
  if (typeof reservationId !== 'string' || !reservationId) {
    return { error: 'Reserva inválida' }
  }

  const parsed = createReviewSchema.safeParse({
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { rating, comment } = parsed.data

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { spot: true, reviews: true },
  })

  if (!reservation) {
    return { error: 'Reserva no encontrada' }
  }

  if (reservation.status === 'CANCELLED') {
    return { error: 'No puedes calificar una reserva cancelada' }
  }

  if (reservation.endTime > new Date()) {
    return { error: 'Solo puedes calificar cuando la reserva ya terminó' }
  }

  let direction: 'RENTER_TO_HOST' | 'HOST_TO_RENTER'
  let targetUserId: string

  if (reservation.userId === user.id) {
    direction = 'RENTER_TO_HOST'
    targetUserId = reservation.spot.ownerId
  } else if (reservation.spot.ownerId === user.id) {
    direction = 'HOST_TO_RENTER'
    targetUserId = reservation.userId
  } else {
    return { error: 'No puedes calificar esta reserva' }
  }

  if (reservation.reviews.some((review) => review.authorId === user.id)) {
    return { error: 'Ya calificaste esta reserva' }
  }

  await prisma.review.create({
    data: {
      reservationId,
      authorId: user.id,
      targetUserId,
      direction,
      rating,
      comment,
      status: 'ACTIVE',
    },
  })

  await notifyChange('reviews')

  return { success: true }
}

export async function appealReviewAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para apelar' }
  }

  const reviewId = formData.get('reviewId')
  if (typeof reviewId !== 'string' || !reviewId) {
    return { error: 'Reseña inválida' }
  }

  const parsed = appealReviewSchema.safeParse({
    appealMessage: formData.get('appealMessage'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { reservation: { select: { spot: { select: { title: true } } } } },
  })

  if (!review || review.authorId !== user.id) {
    return { error: 'Reseña no encontrada' }
  }

  if (review.status !== 'REMOVED') {
    return { error: 'Esta reseña no está disponible para apelar' }
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: 'APPEALED',
      appealMessage: parsed.data.appealMessage,
      appealedAt: new Date(),
    },
  })

  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: 'ADMIN_ALERT',
        title: 'Nueva apelación de reseña',
        message: `${user.name} apeló una reseña en "${review.reservation.spot.title}"`,
      }),
    ),
  )

  await notifyChange('reviews')

  return { success: true }
}
