import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, HelpCircle, KeyRound, Mail, PlusCircle } from 'lucide-react'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Centro de ayuda — estacionando.' }

const TOPICS = [
  { icon: <KeyRound className="size-5 text-accent" />, title: 'Cambiar mi contraseña', description: 'Ve a tu Perfil → sección "Cambiar contraseña". Necesitas tu contraseña actual y la nueva dos veces.' },
  { icon: <PlusCircle className="size-5 text-accent" />, title: 'Publicar un espacio', description: 'Entra a "Publicar espacio" desde el menú, agrega los datos de tu lugar y define tus horarios disponibles.' },
  { icon: <HelpCircle className="size-5 text-accent" />, title: 'Ver o cambiar mi horario de reserva', description: 'Tus reservas confirmadas aparecen en "Mis reservas". El horario elegido queda fijo una vez confirmado.' },
]

export default function HelpCenterPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Ayuda" title="Centro de ayuda" description="Respuestas rápidas a lo más común, y cómo llegar a nosotros si necesitas algo más.">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="rounded-3xl border border-border bg-card p-5">
              {topic.icon}
              <h3 className="mt-3 text-sm font-medium">{topic.title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{topic.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row">
          <Link href="/preguntas-frecuentes" className="flex flex-1 items-center justify-between rounded-2xl border border-border bg-card p-5 hover:bg-muted">
            <span className="text-sm font-medium">Ver todas las preguntas frecuentes</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
          <Link href="/contacto" className="flex flex-1 items-center justify-between rounded-2xl border border-border bg-card p-5 hover:bg-muted">
            <span className="flex items-center gap-2 text-sm font-medium"><Mail className="size-4" /> Escribir a soporte</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}
