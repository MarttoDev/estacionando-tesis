'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { notifyChange } from '@/lib/realtime/notify'

export type NotificationActionState = { error: string } | { success: true } | undefined

export async function markNotificationReadAction(_prevState: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const notificationId = formData.get('notificationId')
  if (typeof notificationId !== 'string' || !notificationId) {
    return { error: 'Notificación inválida' }
  }

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!notification || notification.userId !== user.id) {
    return { error: 'Notificación no encontrada' }
  }

  if (!notification.readAt) {
    await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } })
    await notifyChange('notifications')
  }

  return { success: true }
}

export async function markAllNotificationsReadAction(_prevState: NotificationActionState): Promise<NotificationActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } })
  await notifyChange('notifications')

  return { success: true }
}
