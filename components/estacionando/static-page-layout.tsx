import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import { SiteFooter } from './site-footer'
import { ThemeToggle } from './theme-toggle'

export function StaticPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-[-0.04em]">estacionando<span className="text-accent">.</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Volver al inicio</Link>
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  )
}
