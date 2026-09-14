import type { Metadata } from 'next'
import { StaticPageLayout } from '@/components/estacionando/static-page-layout'
import { PageShell } from '@/components/estacionando/page-shell'

export const metadata: Metadata = { title: 'Política de privacidad — estacionando.' }

const LAST_UPDATED = '13 de septiembre de 2026'

export default function PrivacyPage() {
  return (
    <StaticPageLayout>
      <PageShell eyebrow="Legal" title="Política de privacidad" description={`Última actualización: ${LAST_UPDATED}.`}>
        <div className="flex max-w-3xl flex-col gap-8 text-sm leading-7 text-muted-foreground [&_p]:text-justify">
          <p>
            En estacionando tratamos tus datos personales conforme a la Ley N.º 19.628 sobre Protección de la Vida
            Privada, vigente en Chile, y nos estamos preparando para la Ley N.º 21.719, que entra en vigencia en
            diciembre de 2026 y refuerza estas obligaciones.
          </p>

          <Section title="1. Qué datos recopilamos">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Datos de cuenta: nombre, RUT, correo electrónico y contraseña (guardada siempre cifrada, nunca en texto plano).</li>
              <li>Foto de perfil, si decides subir una.</li>
              <li>Si publicas un espacio: título, comuna/sector, precio, tipo de espacio, disponibilidad y foto del lugar.</li>
              <li>Si reservas un espacio: el horario elegido y el espacio asociado.</li>
              <li>Una cookie de sesión estrictamente necesaria para mantenerte conectado — no usamos cookies de seguimiento ni de publicidad.</li>
            </ul>
          </Section>

          <Section title="2. Para qué usamos tus datos">
            <p>Usamos tus datos exclusivamente para operar la plataforma: crear y proteger tu cuenta, mostrar espacios disponibles, procesar reservas, y permitir la comunicación necesaria entre anfitrión y huésped. No vendemos tus datos ni los usamos con fines publicitarios.</p>
          </Section>

          <Section title="3. Con quién compartimos tus datos">
            <p>Usamos Supabase (base de datos y almacenamiento de archivos) como proveedor de infraestructura para operar el servicio. No compartimos tus datos con terceros para fines comerciales. Si en el futuro incorporamos verificación de identidad con un proveedor especializado, actualizaremos esta política antes de que eso ocurra.</p>
          </Section>

          <Section title="4. Seguridad">
            <p>Tu contraseña se almacena con hash criptográfico (nunca en texto plano), las sesiones se manejan con cookies protegidas, y las conexiones a la base de datos usan cifrado en tránsito. Ningún sistema es perfecto, pero tomamos estas medidas en serio.</p>
          </Section>

          <Section title="5. Tus derechos">
            <p>Puedes solicitarnos en cualquier momento acceder a tus datos, corregirlos, o eliminarlos (derechos ARCO: acceso, rectificación, cancelación y oposición). Para ejercerlos, escríbenos a privacidad@estacionando.cl. Ya puedes cambiar tu contraseña y tu foto de perfil directamente desde tu cuenta.</p>
          </Section>

          <Section title="6. Cuánto tiempo guardamos tus datos">
            <p>Guardamos tus datos mientras tu cuenta esté activa. Si eliminas un espacio publicado, conservamos el historial de reservas ya confirmadas asociadas a él, para que tanto tú como quienes reservaron mantengan su historial. Puedes solicitar la eliminación completa de tu cuenta escribiéndonos.</p>
          </Section>

          <Section title="7. Cambios a esta política">
            <p>Como estacionando es un proyecto en desarrollo activo, esta política puede actualizarse a medida que agregamos funciones. Actualizaremos la fecha al inicio de esta página cuando eso ocurra.</p>
          </Section>

          <Section title="8. Contacto">
            <p>Para cualquier consulta sobre privacidad, escribe a <a href="mailto:privacidad@estacionando.cl" className="font-medium text-accent">privacidad@estacionando.cl</a>.</p>
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
