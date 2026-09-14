import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Términos y condiciones — estacionando.' }

const LAST_UPDATED = '13 de septiembre de 2026'

export default function TermsPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Legal" title="Términos y condiciones" description={`Última actualización: ${LAST_UPDATED}.`}>
        <div className="flex max-w-3xl flex-col gap-8 text-sm leading-7 text-muted-foreground [&_p]:text-justify">
          <p>
            Estos términos rigen el uso de estacionando. (&quot;la plataforma&quot;), un proyecto de tesis desarrollado
            por Gaspar Díaz, Martín Labra y Lorenzo Teixido que conecta a personas que ofrecen espacios de
            estacionamiento con personas que buscan reservarlos. Al crear una cuenta o usar la plataforma, aceptas
            estos términos.
          </p>

          <Section title="1. Qué es estacionando.">
            <p>
              Estacionando es un marketplace: no somos dueños de los estacionamientos publicados ni parte del acuerdo
              entre quien publica un espacio (&quot;anfitrión&quot;) y quien lo reserva (&quot;huésped&quot;).
              Facilitamos el encuentro, la reserva y la comunicación entre ambos.
            </p>
            <p className="mt-3">
              Este sitio es un <b className="text-foreground">prototipo en desarrollo</b>. Algunas funciones descritas
              aquí, como el procesamiento real de pagos o la verificación de identidad con carnet, están en
              construcción y pueden no estar disponibles todavía.
            </p>
          </Section>

          <Section title="2. Cuentas de usuario">
            <p>Para usar la plataforma debes registrarte con datos verídicos, incluyendo tu nombre y RUT. Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta.</p>
            <p className="mt-3">Nos reservamos el derecho de suspender cuentas que entreguen información falsa, incumplan estos términos, o pongan en riesgo a otros usuarios.</p>
          </Section>

          <Section title="3. Publicar un espacio">
            <p>Al publicar un estacionamiento, declaras que tienes el derecho legal para ofrecerlo (eres el propietario o cuentas con autorización) y que la información publicada — dirección aproximada, precio, tipo de espacio y disponibilidad — es exacta.</p>
            <p className="mt-3">Puedes pausar o eliminar tu espacio en cualquier momento. Si tu espacio tiene reservas ya confirmadas al momento de eliminarlo, esas reservas se mantienen vigentes y debes cumplirlas. Si por un motivo mayor no puedes hacerlo, contáctanos según lo descrito en <b className="text-foreground">7. Cancelaciones</b>.</p>
          </Section>

          <Section title="4. Reservas y precios">
            <p>Al reservar, te comprometes a llegar en el horario acordado y a respetar las condiciones indicadas por el anfitrión. El precio mostrado es por hora y se calcula según la duración exacta que elijas dentro del rango disponible.</p>
            <p className="mt-3">El procesamiento de pagos dentro de la plataforma aún no está implementado; por ahora, cualquier intercambio de dinero entre anfitrión y huésped queda fuera del alcance de estacionando.</p>
          </Section>

          <Section title="5. Verificación de identidad">
            <p>Para aumentar la confianza entre usuarios, planeamos incorporar verificación de identidad (documento + selfie) a través de un proveedor externo especializado. Cuando esta función esté disponible, se regirá por su propio aviso de consentimiento informado, separado de estos términos.</p>
          </Section>

          <Section title="6. Conducta esperada">
            <p>No está permitido: publicar información falsa, usar la plataforma para fines distintos al arriendo de espacios de estacionamiento, acosar a otros usuarios, o intentar vulnerar la seguridad del sitio.</p>
          </Section>

          <Section title="7. Cancelaciones y disputas">
            <p>Anfitriones y huéspedes deben resolver directamente cambios de última hora cuando sea posible. Si no logran un acuerdo, o si un anfitrión no puede cumplir una reserva confirmada por un motivo de fuerza mayor, pueden escribirnos a soporte@estacionando.cl y evaluaremos el caso.</p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>Estacionando es un prototipo en desarrollo. En la medida permitida por la ley, no garantizamos disponibilidad ininterrumpida del servicio ni somos responsables por daños derivados del uso de un espacio publicado por terceros.</p>
          </Section>

          <Section title="9. Cambios a estos términos">
            <p>Podemos actualizar estos términos a medida que el proyecto avanza. Si hacemos cambios importantes, actualizaremos la fecha al inicio de esta página.</p>
          </Section>

          <Section title="10. Ley aplicable">
            <p>Estos términos se rigen por las leyes de la República de Chile.</p>
          </Section>

          <Section title="11. Contacto">
            <p>Para preguntas sobre estos términos, escribe a <a href="mailto:contacto@estacionando.cl" className="font-medium text-accent">contacto@estacionando.cl</a>.</p>
          </Section>
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
