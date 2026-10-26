'use client'

import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'

type PwaInstallButtonProps = {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  install: () => Promise<boolean>
  compact?: boolean
}

export function PwaInstallButton({
  canInstall,
  isInstalled,
  isIos,
  install,
  compact = false,
}: PwaInstallButtonProps) {
  const [showIosHelp, setShowIosHelp] = useState(false)

  if (isInstalled) return null

  if (!canInstall && !isIos) return null

  if (isIos && !canInstall) {
    return (
      <div className={compact ? '' : 'mt-2'}>
        <button
          type="button"
          onClick={() => setShowIosHelp((current) => !current)}
          className={
            compact
              ? 'flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-muted'
              : 'flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted'
          }
        >
          <Share2 className="size-4" />
          Agregar a inicio
        </button>

        {showIosHelp && (
          <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
            En iPhone o iPad, toca Compartir y luego
            &quot;Agregar a pantalla de inicio&quot;.
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      className={
        compact
          ? 'flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-muted'
          : 'mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted'
      }
    >
      <Download className="size-4" />
      {compact ? 'Instalar' : 'Instalar Estacionando'}
    </button>
  )
}