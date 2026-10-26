import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { commitWebpayTransaction } from '@/lib/payments/transbank'
import { notifyChange } from '@/lib/realtime/notify'
import { notifyUser } from '@/lib/notifications/notify'
import { paymentFailedEmail, reservationConfirmedHostEmail, reservationConfirmedRenterEmail } from '@/lib/notifications/templates'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Webpay's return flow: once the card holder finishes on Transbank's hosted page, the browser
 * is POSTed back here with `token_ws` to commit. If they abort before entering card details,
 * Transbank instead sends `TBK_TOKEN` (POST, or GET if they abort from the very first screen) —
 * no commit is possible or needed there, the transaction was never started on their side.
 */
export async function GET(request: Request) {
  const tbkToken = new URL(request.url).searchParams.get('TBK_TOKEN')
  if (tbkToken) return handleAbort(tbkToken)
  return NextResponse.redirect(`${baseUrl}/?payment=error`, 303)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const tokenWs = formData.get('token_ws')
  const tbkToken = formData.get('TBK_TOKEN')

  if (typeof tokenWs === 'string' && tokenWs) return handleCommit(tokenWs)
  if (typeof tbkToken === 'string' && tbkToken) return handleAbort(tbkToken)
  return NextResponse.redirect(`${baseUrl}/?payment=error`, 303)
}

async function findPaymentByToken(token: string) {
  return prisma.payment.findFirst({
    where: { providerPaymentId: token },
    include: { reservation: { include: { spot: { include: { owner: true } }, user: true } } },
  })
}

async function markFailed(paymentId: string, reservationId: string) {
  await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: { status: 'FAILED' } }),
    prisma.reservation.update({ where: { id: reservationId }, data: { status: 'CANCELLED' } }),
  ])
  await notifyChange('reservations')
  await notifyChange('parking_spots')
}

async function handleAbort(token: string) {
  const payment = await findPaymentByToken(token)
  if (!payment) return NextResponse.redirect(`${baseUrl}/?payment=error`, 303)

  const { reservation } = payment
  await markFailed(payment.id, reservation.id)
  await notifyUser({
    userId: reservation.userId,
    reservationId: reservation.id,
    type: 'RESERVATION_CANCELLED',
    title: 'Tu pago no se completó',
    message: `Cancelaste el pago de tu reserva en ${reservation.spot.title}, el horario quedó liberado.`,
    email: { to: reservation.user.email, subject: `No se completó tu pago en ${reservation.spot.title}`, html: paymentFailedEmail({ spotTitle: reservation.spot.title }) },
  })
  return NextResponse.redirect(`${baseUrl}/?payment=failed`, 303)
}

async function handleCommit(token: string) {
  const payment = await findPaymentByToken(token)
  if (!payment) return NextResponse.redirect(`${baseUrl}/?payment=error`, 303)

  const { reservation } = payment
  const { spot, user } = reservation

  let result: Awaited<ReturnType<typeof commitWebpayTransaction>>
  try {
    result = await commitWebpayTransaction(token)
  } catch {
    await markFailed(payment.id, reservation.id)
    await notifyUser({
      userId: user.id,
      reservationId: reservation.id,
      type: 'RESERVATION_CANCELLED',
      title: 'Tu pago no se completó',
      message: `No se pudo confirmar el pago de tu reserva en ${spot.title}, el horario quedó liberado.`,
      email: { to: user.email, subject: `No se pudo confirmar tu pago en ${spot.title}`, html: paymentFailedEmail({ spotTitle: spot.title }) },
    })
    return NextResponse.redirect(`${baseUrl}/?payment=failed`, 303)
  }

  if (result.response_code !== 0 || result.status !== 'AUTHORIZED') {
    await markFailed(payment.id, reservation.id)
    await notifyUser({
      userId: user.id,
      reservationId: reservation.id,
      type: 'RESERVATION_CANCELLED',
      title: 'Tu pago fue rechazado',
      message: `El pago de tu reserva en ${spot.title} fue rechazado, el horario quedó liberado.`,
      email: { to: user.email, subject: `Pago rechazado en ${spot.title}`, html: paymentFailedEmail({ spotTitle: spot.title }) },
    })
    return NextResponse.redirect(`${baseUrl}/?payment=failed`, 303)
  }

  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } }),
    prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'CONFIRMED' } }),
  ])
  await notifyChange('reservations')
  await notifyChange('parking_spots')

  await notifyUser({
    userId: user.id,
    reservationId: reservation.id,
    type: 'RESERVATION_CONFIRMED',
    title: 'Tu reserva está confirmada',
    message: `Reservaste ${spot.title} — código ${reservation.confirmationCode}`,
    email: {
      to: user.email,
      subject: `Reserva confirmada en ${spot.title}`,
      html: reservationConfirmedRenterEmail({ spotTitle: spot.title, startTime: reservation.startTime, endTime: reservation.endTime, totalPrice: reservation.totalPrice, confirmationCode: reservation.confirmationCode }),
    },
  })
  await notifyUser({
    userId: spot.owner.id,
    reservationId: reservation.id,
    type: 'RESERVATION_CONFIRMED',
    title: 'Tienes una nueva reserva',
    message: `${user.name} reservó ${spot.title}`,
    email: {
      to: spot.owner.email,
      subject: `Nueva reserva en ${spot.title}`,
      html: reservationConfirmedHostEmail({ spotTitle: spot.title, renterName: user.name, startTime: reservation.startTime, endTime: reservation.endTime, totalPrice: reservation.totalPrice }),
    },
  })

  return NextResponse.redirect(`${baseUrl}/?payment=success`, 303)
}
