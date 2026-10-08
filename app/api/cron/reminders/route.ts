import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { notifyUser } from '@/lib/notifications/notify'
import { reservationReminderEmail } from '@/lib/notifications/templates'

/**
 * Runs once a day (see vercel.json) and emails a reminder for every CONFIRMED reservation
 * starting in the next 24h that hasn't already gotten one — dedup is a direct query against
 * `notifications` (type RESERVATION_REMINDER, same reservationId), not a flag on the
 * reservation itself, so a reservation can only ever get exactly one reminder.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const upcoming = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      startTime: { gte: now, lte: windowEnd },
      notifications: { none: { type: 'RESERVATION_REMINDER' } },
    },
    include: { spot: true, user: true },
  })

  for (const reservation of upcoming) {
    await notifyUser({
      userId: reservation.userId,
      reservationId: reservation.id,
      type: 'RESERVATION_REMINDER',
      title: 'Tu reserva es pronto',
      message: `Tu reserva en ${reservation.spot.title} empieza en menos de 24 horas`,
      email: {
        to: reservation.user.email,
        subject: `Recordatorio: tu reserva en ${reservation.spot.title}`,
        html: reservationReminderEmail({
          spotTitle: reservation.spot.title,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          confirmationCode: reservation.confirmationCode,
        }),
      },
    })
  }

  return NextResponse.json({ remindersSent: upcoming.length })
}
