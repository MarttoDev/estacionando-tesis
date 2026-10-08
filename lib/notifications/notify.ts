import type { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { notifyChange } from '@/lib/realtime/notify'
import { sendEmail } from './email'

/**
 * Creates the in-app Notification row and, if `email` is given, sends the matching email —
 * the single place every feature calls instead of writing to `notifications` directly, so the
 * two never drift apart. The email is best-effort: if it fails, the in-app row still lands
 * (sentAt stays null), since a bell notification mattering more than an email is the point.
 */
export async function notifyUser(params: {
  userId: string
  reservationId?: string
  type: NotificationType
  title: string
  message: string
  email?: { to: string; subject: string; html: string }
}) {
  const result = params.email ? await sendEmail(params.email) : { sent: false }

  await prisma.notification.create({
    data: {
      userId: params.userId,
      reservationId: params.reservationId,
      type: params.type,
      title: params.title,
      message: params.message,
      sentAt: result.sent ? new Date() : null,
    },
  })

  await notifyChange('notifications')
}
