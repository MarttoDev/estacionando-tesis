'use server'

import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { notifyChange } from '@/lib/realtime/notify'

export type ReserveSpotState = { error: string } | { success: true } | undefined

function generateConfirmationCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

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
    include: { spot: true },
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

  try {
    await prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.reservation.findFirst({
          where: {
            spotId: availability.spotId,
            status: 'CONFIRMED',
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        })

        if (overlapping) {
          throw new Error('SLOT_TAKEN')
        }

        await tx.reservation.create({
          data: {
            spotId: availability.spotId,
            userId: user.id,
            availabilityId: availability.id,
            startTime,
            endTime,
            totalPrice,
            status: 'CONFIRMED',
            confirmationCode: generateConfirmationCode(),
          },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
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

  return { success: true }
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

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
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

  return { success: true }
}
