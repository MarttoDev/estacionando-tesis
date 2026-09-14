'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserRound } from 'lucide-react'
import { PageShell } from './page-shell'
import { CreateSpotWizard } from './create-spot-wizard'
import { MySpotsList } from './my-spots-list'
import { EditSpotForm } from './edit-spot-form'
import type { SessionUser } from '@/lib/auth/types'
import type { OwnerSpot } from '@/lib/parking-spots/queries'

type ParkingTypeOption = { id: string; name: string }
type Mode = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; spotId: string }

export function Publish({ user, parkingTypes, ownerSpots }: { user: SessionUser | null; parkingTypes: ParkingTypeOption[]; ownerSpots: OwnerSpot[] }) {
  const [mode, setMode] = useState<Mode>(ownerSpots.length === 0 ? { kind: 'create' } : { kind: 'list' })

  if (!user) {
    return (
      <PageShell eyebrow="Comparte tu espacio" title="Publica tu estacionamiento" description="Inicia sesión para publicar un espacio y empezar a recibir reservas.">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center">
          <UserRound className="size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Aún no has iniciado sesión</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Crea una cuenta o inicia sesión para publicar tu estacionamiento.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Iniciar sesión</Link>
            <Link href="/register" className="rounded-full border border-border px-5 py-3 text-sm font-medium">Crear cuenta</Link>
          </div>
        </div>
      </PageShell>
    )
  }

  if (mode.kind === 'create') {
    return <CreateSpotWizard parkingTypes={parkingTypes} onDone={() => setMode({ kind: 'list' })} onBack={ownerSpots.length > 0 ? () => setMode({ kind: 'list' }) : undefined} />
  }

  if (mode.kind === 'edit') {
    const spot = ownerSpots.find((candidate) => candidate.id === mode.spotId)
    if (spot) {
      return <EditSpotForm spot={spot} parkingTypes={parkingTypes} onBack={() => setMode({ kind: 'list' })} />
    }
  }

  return <MySpotsList spots={ownerSpots} onCreateNew={() => setMode({ kind: 'create' })} onEdit={(spotId) => setMode({ kind: 'edit', spotId })} />
}
