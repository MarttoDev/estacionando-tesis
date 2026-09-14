import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Sobre nosotros — estacionando.' }

export default function AboutPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Sobre nosotros" title="Un proyecto de tesis con un problema real que resolver" description="Estacionando nace para resolver algo que casi todos vivimos en las grandes ciudades: no encontrar dónde estacionar.">
        <div className="flex max-w-2xl flex-col gap-6 text-sm leading-7 text-muted-foreground sm:text-base [&_p]:text-justify">
          <p>
            Estacionando es un proyecto de tesis de ingeniería desarrollado por{' '}
            <b className="text-foreground">Gaspar Díaz</b>, <b className="text-foreground">Martín Labra</b> y{' '}
            <b className="text-foreground">Lorenzo Teixido</b>. Nuestro punto de partida fue simple: en las grandes
            ciudades sobra gente buscando estacionamiento y sobran espacios privados que se usan solo algunas horas al
            día. Quisimos construir el punto de encuentro entre ambos.
          </p>
          <p>
            La plataforma conecta a personas que tienen un espacio disponible — un estacionamiento particular, uno
            techado, o simplemente un lugar libre algunas horas al día — con quienes necesitan estacionar cerca de su
            destino, de forma simple y con la confianza de una comunidad verificada.
          </p>
          <p>
            Estamos construyendo esto como un producto real, no solo como un ejercicio académico: además del
            marketplace de reservas, estamos desarrollando motores propios de recomendación de precio según demanda y
            de ruteo óptimo para sugerir el mejor lugar según ubicación, horario y precio.
          </p>
          <p>
            Este sitio es un prototipo en desarrollo activo. Algunas funciones — como la verificación de identidad
            con carnet y los pagos — todavía están en construcción. Si algo no funciona como esperas, cuéntanos en{' '}
            <a href="mailto:contacto@estacionando.cl" className="font-medium text-accent">contacto@estacionando.cl</a>.
          </p>
        </div>
      </PageShell>
    </StaticPageLayout>
  )
}
