import type { ReactNode } from 'react'

type PageShellProps = { eyebrow: string; title: string; description: string; children: ReactNode }

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <section className="mx-auto min-h-[calc(100dvh-64px)] max-w-[1440px] px-5 py-12 lg:px-10 lg:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.075em] sm:text-6xl">{title}</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
