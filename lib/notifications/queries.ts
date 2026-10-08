import { prisma } from '@/lib/db/prisma'

export type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  readAt: Date | null
  createdAt: Date
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }))
}
