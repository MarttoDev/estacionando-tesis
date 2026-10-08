import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'estacionando <onboarding@resend.dev>'

/**
 * Sends an email via Resend. Never throws — a failed or unconfigured email provider
 * must not block the reservation/cancellation flow it's attached to; the caller decides
 * what to do with `sent: false` (here, the in-app Notification row still gets created,
 * just with sentAt left null).
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY no configurado — no se envió "${subject}" a ${to}`)
    return { sent: false }
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    if (result.error) {
      console.error('[email] Resend rechazó el envío:', result.error)
      return { sent: false }
    }
    return { sent: true }
  } catch (error) {
    console.error('[email] Error inesperado enviando email:', error)
    return { sent: false }
  }
}
