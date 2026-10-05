'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { ADMIN_BOOTSTRAP_EMAIL } from '@/lib/auth/constants'
import { deleteOrArchiveSpot } from '@/lib/parking-spots/delete-spot'
import { notifyChange } from '@/lib/realtime/notify'

export type AdminActionState = { error: string } | { success: true } | undefined

export async function promoteAdminAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const email = formData.get('email')
  if (typeof email !== 'string' || !email.trim()) {
    return { error: 'Ingresa un correo' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const target = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!target) {
    return { error: 'Ese correo no tiene una cuenta registrada en la plataforma todavía' }
  }
  if (target.isAdmin) {
    return { error: 'Ese usuario ya es administrador' }
  }

  await prisma.user.update({ where: { id: target.id }, data: { isAdmin: true } })
  await notifyChange('users')
  return { success: true }
}

export async function demoteAdminAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const userId = formData.get('userId')
  if (typeof userId !== 'string' || !userId) {
    return { error: 'Usuario inválido' }
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) {
    return { error: 'Usuario no encontrado' }
  }
  if (target.email === ADMIN_BOOTSTRAP_EMAIL) {
    return { error: 'No puedes quitarle el acceso al administrador principal' }
  }
  if (target.id === caller.id) {
    return { error: 'No puedes quitarte el acceso a ti mismo' }
  }

  await prisma.user.update({ where: { id: userId }, data: { isAdmin: false } })
  await notifyChange('users')
  return { success: true }
}

export async function deleteSpotAdminAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const spotId = formData.get('spotId')
  if (typeof spotId !== 'string' || !spotId) {
    return { error: 'Espacio inválido' }
  }

  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } })
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }

  await deleteOrArchiveSpot(spotId)
  return { success: true }
}

export async function deleteUserAdminAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const userId = formData.get('userId')
  if (typeof userId !== 'string' || !userId) {
    return { error: 'Usuario inválido' }
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) {
    return { error: 'Usuario no encontrado' }
  }
  if (target.email === ADMIN_BOOTSTRAP_EMAIL) {
    return { error: 'No puedes eliminar al administrador principal' }
  }
  if (target.id === caller.id) {
    return { error: 'No puedes eliminar tu propia cuenta' }
  }

  const now = new Date()
  const [ownReservations, guestReservations] = await Promise.all([
    prisma.reservation.count({ where: { spot: { ownerId: userId }, status: 'CONFIRMED', endTime: { gt: now } } }),
    prisma.reservation.count({ where: { userId, status: 'CONFIRMED', endTime: { gt: now } } }),
  ])

  if (ownReservations > 0) {
    return { error: 'Este usuario tiene espacios con reservas activas de otras personas. Deben resolverse antes de eliminarlo.' }
  }
  if (guestReservations > 0) {
    return { error: 'Este usuario tiene reservas activas propias. Deben resolverse antes de eliminarlo.' }
  }

  await prisma.user.delete({ where: { id: userId } })
  await notifyChange('users')
  await notifyChange('parking_spots')
  return { success: true }
}

export async function cancelReservationAdminAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const reservationId = formData.get('reservationId')
  if (typeof reservationId !== 'string' || !reservationId) {
    return { error: 'Reserva inválida' }
  }

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!reservation) {
    return { error: 'Reserva no encontrada' }
  }
  if (reservation.status !== 'CONFIRMED') {
    return { error: 'Esta reserva ya no está activa' }
  }

  await prisma.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } })
  await notifyChange('reservations')
  await notifyChange('parking_spots')
  return { success: true }
}

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const

export async function moveTaskAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const taskId = formData.get('taskId')
  if (typeof taskId !== 'string' || !taskId) {
    return { error: 'Tarea inválida' }
  }

  const status = formData.get('status')
  if (typeof status !== 'string' || !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
    return { error: 'Columna inválida' }
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return { error: 'Tarea no encontrada' }
  }

  await prisma.task.update({ where: { id: taskId }, data: { status: status as (typeof TASK_STATUSES)[number] } })
  await notifyChange('tasks')
  return { success: true }
}

export async function assignTaskAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const caller = await getCurrentUser()
  if (!caller || !caller.isAdmin) {
    return { error: 'No tienes permisos de administrador' }
  }

  const taskId = formData.get('taskId')
  if (typeof taskId !== 'string' || !taskId) {
    return { error: 'Tarea inválida' }
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return { error: 'Tarea no encontrada' }
  }

  const userIdRaw = formData.get('userId')
  const userId = typeof userIdRaw === 'string' && userIdRaw ? userIdRaw : null

  if (userId) {
    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target || !target.isAdmin) {
      return { error: 'Solo se puede asignar una tarea a un administrador' }
    }
  }

  await prisma.task.update({ where: { id: taskId }, data: { assignedToId: userId } })
  await notifyChange('tasks')
  return { success: true }
}
