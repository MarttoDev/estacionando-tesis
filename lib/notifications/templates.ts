import { formatReservationRange } from '@/lib/estacionando/format'

const ACCENT = '#3352db'
const INK = '#14161c'
const MUTED = '#666b7d'
const LINE = '#dfe1ea'

function layout(bodyHtml: string, ctaUrl?: string, ctaLabel?: string) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f6f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:36px 24px;">
    <p style="font-size:20px;font-weight:800;color:${INK};margin:0 0 28px;letter-spacing:-0.02em;">estacionando<span style="color:${ACCENT}">.</span></p>
    ${bodyHtml}
    ${ctaUrl && ctaLabel ? `<p style="margin-top:28px;"><a href="${ctaUrl}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">${ctaLabel}</a></p>` : ''}
    <p style="margin-top:36px;padding-top:20px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED};">Este es un correo automático de estacionando — no respondas directamente a este mensaje.</p>
  </div>
</body>
</html>`
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:6px 0;font-size:13px;color:${MUTED};">${label}</td><td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;text-align:right;">${value}</td></tr>`
}

function detailTable(rows: string) {
  return `<table style="width:100%;border-collapse:collapse;margin-top:16px;">${rows}</table>`
}

export function reservationConfirmedRenterEmail(params: {
  spotTitle: string
  startTime: Date
  endTime: Date
  totalPrice: number
  confirmationCode: string
}) {
  const body = `
    <p style="font-size:18px;font-weight:700;color:${INK};margin:0;">Tu reserva está confirmada</p>
    <p style="margin-top:8px;font-size:14px;color:${MUTED};line-height:1.6;">Reservaste <strong style="color:${INK}">${params.spotTitle}</strong> para ${formatReservationRange(params.startTime, params.endTime)}.</p>
    ${detailTable(
      detailRow('Total', `$${params.totalPrice.toLocaleString('es-CL')}`) +
      detailRow('Código de confirmación', params.confirmationCode),
    )}`
  return layout(body)
}

export function reservationConfirmedHostEmail(params: {
  spotTitle: string
  renterName: string
  startTime: Date
  endTime: Date
  totalPrice: number
}) {
  const body = `
    <p style="font-size:18px;font-weight:700;color:${INK};margin:0;">Tienes una nueva reserva</p>
    <p style="margin-top:8px;font-size:14px;color:${MUTED};line-height:1.6;"><strong style="color:${INK}">${params.renterName}</strong> reservó <strong style="color:${INK}">${params.spotTitle}</strong> para ${formatReservationRange(params.startTime, params.endTime)}.</p>
    ${detailTable(detailRow('Total a recibir', `$${params.totalPrice.toLocaleString('es-CL')}`))}`
  return layout(body)
}

export function reservationCancelledEmail(params: {
  spotTitle: string
  startTime: Date
  endTime: Date
  audience: 'renter' | 'host'
}) {
  const intro =
    params.audience === 'renter'
      ? `Tu reserva en <strong style="color:${INK}">${params.spotTitle}</strong> fue cancelada.`
      : `La reserva de <strong style="color:${INK}">${params.spotTitle}</strong> fue cancelada.`
  const body = `
    <p style="font-size:18px;font-weight:700;color:${INK};margin:0;">Reserva cancelada</p>
    <p style="margin-top:8px;font-size:14px;color:${MUTED};line-height:1.6;">${intro} Era para ${formatReservationRange(params.startTime, params.endTime)}.</p>`
  return layout(body)
}

export function passwordResetEmail(params: { resetUrl: string }) {
  const body = `
    <p style="font-size:18px;font-weight:700;color:${INK};margin:0;">Restablece tu contraseña</p>
    <p style="margin-top:8px;font-size:14px;color:${MUTED};line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, usa el botón de abajo — el link expira en 1 hora.</p>
    <p style="margin-top:12px;font-size:13px;color:${MUTED};">Si no fuiste tú, puedes ignorar este correo con tranquilidad: tu contraseña no cambia hasta que alguien use este link.</p>`
  return layout(body, params.resetUrl, 'Restablecer contraseña')
}

export function reservationReminderEmail(params: { spotTitle: string; startTime: Date; endTime: Date; confirmationCode: string }) {
  const body = `
    <p style="font-size:18px;font-weight:700;color:${INK};margin:0;">Tu reserva es pronto</p>
    <p style="margin-top:8px;font-size:14px;color:${MUTED};line-height:1.6;">Recuerda tu reserva en <strong style="color:${INK}">${params.spotTitle}</strong>, ${formatReservationRange(params.startTime, params.endTime)}.</p>
    ${detailTable(detailRow('Código de confirmación', params.confirmationCode))}`
  return layout(body)
}
