import type { Metadata } from 'next'
import { CalendarCheck, MapPinned, ShieldCheck } from 'lucide-react'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Cómo funciona — estacionando.' }

export default function HowItWorksPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Guía" title="Cómo funciona estacionando" description="Encontrar o compartir un estacionamiento toma unos minutos.">
        <div className="grid max-w-4xl gap-6 sm:grid-cols-3">
          <Step icon={<MapPinned className="size-6 text-accent" />} title="1. Explora espacios cerca de ti" description="Busca por comuna o sector y revisa fotos, precio por hora y tipo de espacio de cada anuncio." />
          <Step icon={<CalendarCheck className="size-6 text-accent" />} title="2. Elige tu horario y reserva" description="Cada espacio muestra su disponibilidad real. Elige el día y las horas exactas que necesitas — pagas solo por ese tiempo." />
          <Step icon={<ShieldCheck className="size-6 text-accent" />} title="3. Llega con confianza" description="Recibes un código de confirmación para tu reserva. El anfitrión ya definió ese horario como disponible, así que el lugar es tuyo." />
        </div>

        <div className="mt-14 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">¿Tienes un espacio libre?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Publícalo en minutos: cuéntanos dónde está, qué precio quieres cobrar por hora, y en qué días y horarios
            está disponible. Puedes agregar varios horarios distintos, editar tu anuncio o pausarlo cuando quieras
            desde &quot;Mis espacios&quot;.
          </p>
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}

function Step({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      {icon}
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
