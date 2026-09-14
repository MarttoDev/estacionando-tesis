'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'

const INFO_LINKS: [string, string][] = [
  ['Cómo funciona', '/como-funciona'],
  ['Preguntas frecuentes', '/preguntas-frecuentes'],
  ['Guía de anfitriones', '/guia-anfitriones'],
  ['Centro de ayuda', '/centro-ayuda'],
  ['Sobre nosotros', '/sobre-nosotros'],
  ['Términos y condiciones', '/terminos'],
  ['Privacidad', '/privacidad'],
  ['Contacto', '/contacto'],
]

export function MobileMenu({ open, onClose, children }: { open: boolean; onClose: () => void; children?: ReactNode }) {
  useLockBodyScroll(open)

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 bg-background md:hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <p className="text-sm font-semibold">Menú</p>
        <button aria-label="Cerrar menú" onClick={onClose} className="rounded-full border border-border p-2.5"><X className="size-4" /></button>
      </div>
      <div className="flex h-[calc(100%-4rem)] flex-col overflow-y-auto px-5 py-6">
        {children}
        <div className="mt-6 flex flex-col gap-1 border-t border-border pt-6">
          {INFO_LINKS.map(([label, href]) => (
            <Link key={href} href={href} onClick={onClose} className="rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
