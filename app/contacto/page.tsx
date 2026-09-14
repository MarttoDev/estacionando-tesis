import type { Metadata } from 'next'
import { Mail, MessageCircle, ShieldAlert } from 'lucide-react'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Contacto — estacionando.' }

export default function ContactPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Contacto" title="Estamos para ayudarte" description="Escríbenos si tienes dudas, problemas con tu cuenta, o algo que reportar.">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          <a href="mailto:contacto@estacionando.cl" className="rounded-3xl border border-border bg-card p-6 hover:bg-muted">
            <Mail className="size-6 text-accent" />
            <h3 className="mt-4 font-medium">Consultas generales</h3>
            <p className="mt-1 text-sm text-muted-foreground">contacto@estacionando.cl</p>
          </a>
          <a href="mailto:soporte@estacionando.cl" className="rounded-3xl border border-border bg-card p-6 hover:bg-muted">
            <MessageCircle className="size-6 text-accent" />
            <h3 className="mt-4 font-medium">Soporte técnico</h3>
            <p className="mt-1 text-sm text-muted-foreground">soporte@estacionando.cl</p>
          </a>
          <a href="mailto:soporte@estacionando.cl?subject=No%20puedo%20cumplir%20una%20reserva" className="rounded-3xl border border-border bg-card p-6 hover:bg-muted">
            <ShieldAlert className="size-6 text-accent" />
            <h3 className="mt-4 font-medium">No puedo cumplir una reserva</h3>
            <p className="mt-1 text-sm text-muted-foreground">Contáctanos antes de la fecha reservada</p>
          </a>
        </div>
        <p className="mt-8 max-w-2xl text-sm leading-6 text-muted-foreground">
          Estacionando es un proyecto de tesis en desarrollo activo, así que los tiempos de respuesta pueden variar.
          Haremos lo posible por responder dentro de 48 horas hábiles.
        </p>
      </PageShell>
    </StaticPageLayout>
  )
}
