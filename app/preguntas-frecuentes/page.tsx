import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Preguntas frecuentes — estacionando.' }

const FAQS: [string, string][] = [
  ['¿Necesito una cuenta para explorar espacios?', 'No, puedes explorar y ver los espacios disponibles sin registrarte. Necesitas una cuenta solo para reservar o publicar un espacio.'],
  ['¿Cómo elijo cuántas horas reservar?', 'Cada espacio muestra su rango de disponibilidad completo. Al reservar, eliges tu propio horario de inicio y término dentro de ese rango — el precio se calcula según las horas exactas que elijas.'],
  ['¿Puedo publicar más de un estacionamiento?', 'Sí. Desde "Mis espacios" puedes publicar y administrar todos los espacios que quieras, cada uno con su propio precio y disponibilidad.'],
  ['¿Cómo funcionan los pagos?', 'El procesamiento de pagos dentro de la plataforma todavía está en desarrollo — estacionando es un proyecto de tesis en construcción activa.'],
  ['¿Qué pasa si el anfitrión no puede cumplir mi reserva?', 'Esto no debería ocurrir con una reserva confirmada, pero si sucede por un motivo mayor, contáctanos en soporte@estacionando.cl y te ayudamos a resolverlo.'],
  ['¿Puedo eliminar un espacio que ya publiqué?', 'Sí, desde "Mis espacios". Si no tiene reservas activas, se elimina de inmediato. Si tiene una reserva confirmada, el espacio se retira de las búsquedas pero esa reserva debe cumplirse igual — te avisamos con un mensaje antes de confirmar.'],
  ['¿Qué pasa con mis datos personales?', 'Los tratamos según nuestra política de privacidad: tu contraseña siempre va cifrada, no vendemos tus datos, y puedes pedir acceso o eliminación en cualquier momento.'],
  ['¿La verificación de identidad ya está disponible?', 'Está planificada pero aún no implementada. Cuando esté lista, te pediremos tu carnet y una selfie a través de un proveedor especializado, con su propio consentimiento informado.'],
]

export default function FaqPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Ayuda" title="Preguntas frecuentes" description="Lo que más nos preguntan sobre estacionando.">
        <div className="flex max-w-2xl flex-col divide-y divide-border">
          {FAQS.map(([question, answer]) => (
            <div key={question} className="py-5 first:pt-0">
              <h3 className="font-medium">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}
