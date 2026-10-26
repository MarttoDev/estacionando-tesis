'use server'

import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { notifyChange } from '@/lib/realtime/notify'
import { notifyUser } from '@/lib/notifications/notify'
import { reservationCancelledEmail } from '@/lib/notifications/templates'
import { createWebpayTransaction, generateBuyOrder, refundWebpayTransaction } from '@/lib/payments/transbank'

export type ReserveSpotState = { error: string } | { success: true } | { redirect: { url: string; token: string } } | undefined

function generateConfirmationCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

/** A PENDING reservation whose checkout was abandoned (tab closed, never returned from Webpay)
 * would otherwise block the slot forever — anyone probing the same slot frees it first. */
const PENDING_RESERVATION_TTL_MS = 15 * 60_000

export async function createReservationAction(_prevState: ReserveSpotState, formData: FormData): Promise<ReserveSpotState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para reservar' }
  }

  const availabilityId = formData.get('availabilityId')
  const startTimeRaw = formData.get('startTime')
  const endTimeRaw = formData.get('endTime')

  if (typeof availabilityId !== 'string' || !availabilityId || typeof startTimeRaw !== 'string' || typeof endTimeRaw !== 'string') {
    return { error: 'Selecciona un horario disponible' }
  }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
    return { error: 'El horario elegido no es válido' }
  }

  if (startTime < new Date()) {
    return { error: 'No puedes reservar un horario que ya pasó' }
  }

  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
    include: { spot: { include: { owner: true } } },
  })

  if (!availability) {
    return { error: 'Este horario ya no existe' }
  }

  if (availability.spot.ownerId === user.id) {
    return { error: 'No puedes reservar tu propio espacio' }
  }

  if (startTime < availability.startTime || endTime > availability.endTime) {
    return { error: 'El horario elegido está fuera del rango disponible' }
  }

  const hours = (endTime.getTime() - startTime.getTime()) / 3_600_000
  const totalPrice = Math.round(hours * availability.spot.pricePerHour)

  let reservationId: string
  let buyOrder: string

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // Free up slots whose checkout was abandoned before touching the overlap check below.
        await tx.reservation.updateMany({
          where: { spotId: availability.spotId, status: 'PENDING', createdAt: { lt: new Date(Date.now() - PENDING_RESERVATION_TTL_MS) } },
          data: { status: 'CANCELLED' },
        })

        const overlapping = await tx.reservation.findFirst({
          where: {
            spotId: availability.spotId,
            status: { in: ['CONFIRMED', 'PENDING'] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        })

        if (overlapping) {
          throw new Error('SLOT_TAKEN')
        }

        const reservation = await tx.reservation.create({
          data: {
            spotId: availability.spotId,
            userId: user.id,
            availabilityId: availability.id,
            startTime,
            endTime,
            totalPrice,
            status: 'PENDING',
            confirmationCode: generateConfirmationCode(),
          },
        })

        const order = generateBuyOrder()
        await tx.payment.create({
          data: { reservationId: reservation.id, amount: totalPrice, provider: 'transbank', providerPaymentId: order, status: 'PENDING' },
        })

        return { reservationId: reservation.id, buyOrder: order }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    reservationId = created.reservationId
    buyOrder = created.buyOrder
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_TAKEN') {
      return { error: 'Ese horario ya no está disponible, elige otro' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { error: 'Alguien más reservó justo ahora, intenta de nuevo' }
    }
    throw error
  }

  await notifyChange('reservations')
  await notifyChange('parking_spots')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const webpay = await createWebpayTransaction({
      buyOrder,
      sessionId: reservationId,
      amount: totalPrice,
      returnUrl: `${baseUrl}/api/payments/webpay/return`,
    })
    // providerPaymentId switches from the buyOrder to the Webpay token: the return route looks
    // the Payment up by this field, and Webpay only ever sends back the token, never the buyOrder.
    await prisma.payment.update({ where: { reservationId }, data: { providerPaymentId: webpay.token } })
    return { redirect: { url: webpay.url, token: webpay.token } }
  } catch {
    await prisma.$transaction([
      prisma.payment.update({ where: { reservationId }, data: { status: 'FAILED' } }),
      prisma.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } }),
    ])
    await notifyChange('reservations')
    await notifyChange('parking_spots')
    return { error: 'No se pudo iniciar el pago con Webpay. Intenta nuevamente.' }
  }
}

export type CancelReservationState = { error: string } | { success: true } | undefined

export async function cancelReservationAction(_prevState: CancelReservationState, formData: FormData): Promise<CancelReservationState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const reservationId = formData.get('reservationId')
  if (typeof reservationId !== 'string' || !reservationId) {
    return { error: 'Reserva inválida' }
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { spot: { include: { owner: true } } },
  })
  if (!reservation || reservation.userId !== user.id) {
    return { error: 'Reserva no encontrada' }
  }

  if (reservation.status !== 'CONFIRMED') {
    return { error: 'Esta reserva ya no se puede cancelar' }
  }

  if (reservation.endTime <= new Date()) {
    return { error: 'Esta reserva ya finalizó y no se puede cancelar' }
  }

  await prisma.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } })

  await notifyChange('reservations')
  await notifyChange('parking_spots')

  const { spot, startTime, endTime } = reservation
  await notifyUser({
    userId: user.id,
    reservationId,
    type: 'RESERVATION_CANCELLED',
    title: 'Cancelaste tu reserva',
    message: `Cancelaste tu reserva en ${spot.title}`,
    email: {
      to: user.email,
      subject: `Reserva cancelada en ${spot.title}`,
      html: reservationCancelledEmail({ spotTitle: spot.title, startTime, endTime, audience: 'renter' }),
    },
  })
  await notifyUser({
    userId: spot.owner.id,
    reservationId,
    type: 'RESERVATION_CANCELLED',
    title: 'Una reserva fue cancelada',
    message: `${user.name} canceló su reserva en ${spot.title}`,
    email: {
      to: spot.owner.email,
      subject: `Reserva cancelada en ${spot.title}`,
      html: reservationCancelledEmail({ spotTitle: spot.title, startTime, endTime, audience: 'host' }),
    },
  })

  await refundCompletedPayment(reservationId, user.id)

  return { success: true }
}

/** Política 90/10: una cancelación devuelve el 90% de lo pagado y retiene el 10% como cargo
 * por cancelación. Best-effort — la reserva ya quedó cancelada aunque el reembolso falle; en
 * ese caso se avisa al usuario en vez de dejarlo sin explicación. */
async function refundCompletedPayment(reservationId: string, renterId: string) {
  const payment = await prisma.payment.findUnique({ where: { reservationId } })
  if (!payment || payment.status !== 'COMPLETED' || !payment.providerPaymentId) return

  const refundAmount = Math.round(payment.amount * 0.9)
  try {
    await refundWebpayTransaction(payment.providerPaymentId, refundAmount)
    await prisma.payment.update({ where: { reservationId }, data: { status: 'PARTIALLY_REFUNDED', refundedAmount: refundAmount } })
  } catch {
    await notifyUser({
      userId: renterId,
      reservationId,
      type: 'RESERVATION_CANCELLED',
      title: 'Tu reembolso no se procesó automáticamente',
      message: `Hubo un problema al devolver el 90% de tu pago ($${refundAmount.toLocaleString('es-CL')}). Contáctanos para completarlo.`,
    })
  }
}
