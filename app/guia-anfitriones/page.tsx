import type { Metadata } from 'next'
import { Camera, Clock3, MapPin, ShieldCheck, Tag } from 'lucide-react'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Guía de anfitriones — estacionando.' }

const TIPS: { icon: React.ReactNode; title: string; description: string }[] = [
  { icon: <Camera className="size-5 text-accent" />, title: 'Sube una foto real del espacio', description: 'Los anuncios con una foto clara del lugar generan más confianza que los que usan la imagen genérica.' },
  { icon: <Tag className="size-5 text-accent" />, title: 'Define un precio competitivo', description: 'Revisa espacios similares en tu comuna antes de fijar el precio por hora. Puedes cambiarlo cuando quieras desde "Mis espacios".' },
  { icon: <Clock3 className="size-5 text-accent" />, title: 'Agrega horarios realistas', description: 'Solo marca como disponibles los rangos en los que realmente puedes prestar el espacio, incluyendo el tiempo para llegar y salir.' },
  { icon: <MapPin className="size-5 text-accent" />, title: 'Describe bien la ubicación', description: 'Un título y comuna claros ayudan a que te encuentren quienes buscan estacionar cerca de ese sector.' },
  { icon: <ShieldCheck className="size-5 text-accent" />, title: 'Cumple tus reservas confirmadas', description: 'Una vez que alguien reserva un horario, ese compromiso queda vigente. Si tienes un imprevisto grave, contacta a soporte antes de la fecha reservada.' },
]

export default function HostGuidePage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Para anfitriones" title="Guía de anfitriones" description="Algunas recomendaciones para que tu espacio se reserve más rápido y sin problemas.">
        <div className="flex max-w-2xl flex-col gap-6">
          {TIPS.map((tip) => (
            <div key={tip.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15">{tip.icon}</span>
              <div>
                <h3 className="font-medium">{tip.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}
