export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span className={`relative inline-flex ${className} shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground`}>
      <span className="text-lg font-bold leading-none tracking-tight">P</span>
      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
    </span>
  )
}
