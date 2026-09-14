import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { BrandMark } from './brand-mark'

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Descubre',
    links: [
      ['Explorar lugares', '/'],
      ['Cómo funciona', '/como-funciona'],
      ['Preguntas frecuentes', '/preguntas-frecuentes'],
    ],
  },
  {
    title: 'Comparte',
    links: [
      ['Publicar espacio', '/'],
      ['Guía de anfitriones', '/guia-anfitriones'],
      ['Centro de ayuda', '/centro-ayuda'],
    ],
  },
  {
    title: 'Estacionando',
    links: [
      ['Sobre nosotros', '/sobre-nosotros'],
      ['Términos y condiciones', '/terminos'],
      ['Privacidad', '/privacidad'],
      ['Contacto', '/contacto'],
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 lg:grid-cols-[1.3fr_2fr] lg:px-10 lg:py-16">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-[-0.04em]">estacionando<span className="text-accent">.</span></span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">La forma más simple de encontrar y compartir un lugar para estacionar.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-accent" /> Comunidad verificada</div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <p className="text-sm font-semibold">{title}</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                {links.map(([label, href]) => <Link key={label} href={href} className="text-left hover:text-foreground">{label}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
