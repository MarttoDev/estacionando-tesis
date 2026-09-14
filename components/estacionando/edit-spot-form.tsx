'use client'

import { useActionState, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'
import { PageShell } from './page-shell'
import { AvailabilityPicker, type AvailabilityValue } from './availability-picker'
import { AddressAutocomplete, type AddressValue } from './address-autocomplete'
import { addAvailabilityAction, updateParkingSpotAction } from '@/lib/parking-spots/actions'
import { computeAvailabilityRange, toDateIso } from '@/lib/estacionando/format'
import { compressImage } from '@/lib/estacionando/compress-image'
import type { OwnerSpot } from '@/lib/parking-spots/queries'

type ParkingTypeOption = { id: string; name: string }

function defaultWindow(): AvailabilityValue {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  return { startDate: toDateIso(start), startHour: 9, endDate: toDateIso(start), endHour: 18 }
}

export function EditSpotForm({ spot, parkingTypes, onBack }: { spot: OwnerSpot; parkingTypes: ParkingTypeOption[]; onBack: () => void }) {
  const [updateState, updateAction, updatePending] = useActionState(updateParkingSpotAction, undefined)
  const [availabilityState, availabilityAction, availabilityPending] = useActionState(addAvailabilityAction, undefined)
  const [windows, setWindows] = useState<AvailabilityValue[]>([defaultWindow()])
  const [address, setAddress] = useState<AddressValue>({ text: spot.area, comuna: spot.comuna, latitude: spot.latitude, longitude: spot.longitude })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [priceClientError, setPriceClientError] = useState<string | null>(null)
  const [availabilityClientError, setAvailabilityClientError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (updateState?.success) router.refresh()
  }, [updateState, router])

  useEffect(() => {
    if (availabilityState?.success) {
      router.refresh()
      setWindows([defaultWindow()])
    }
  }, [availabilityState, router])

  function updateWindow(index: number, value: AvailabilityValue) {
    setWindows((current) => current.map((window, i) => (i === index ? value : window)))
  }

  async function handlePhotoChange(input: HTMLInputElement) {
    const file = input.files?.[0]
    if (!file) {
      setPhotoPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      return
    }

    setPhotoProcessing(true)
    try {
      const compressed = await compressImage(file)
      if (compressed !== file) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(compressed)
        input.files = dataTransfer.files
      }

      setPhotoPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return URL.createObjectURL(compressed)
      })
    } finally {
      setPhotoProcessing(false)
    }
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    if (photoProcessing) {
      event.preventDefault()
      setPriceClientError('Espera a que termine de optimizarse la foto antes de guardar')
      return
    }

    const price = Number(new FormData(event.currentTarget).get('pricePerHour'))
    if (!Number.isFinite(price) || price <= 0) {
      event.preventDefault()
      setPriceClientError('Ingresa un precio por hora mayor a 0')
      return
    }
    setPriceClientError(null)
  }

  function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    for (const window of windows) {
      const { start, end } = computeAvailabilityRange(window.startDate, window.startHour, window.endDate, window.endHour)
      if (new Date(end) <= new Date(start)) {
        event.preventDefault()
        setAvailabilityClientError('La hora de término debe ser posterior a la de inicio')
        return
      }
    }
    setAvailabilityClientError(null)
  }

  return (
    <PageShell eyebrow="Editar espacio" title={spot.title} description="Actualiza los datos de tu espacio o agrega nuevos horarios disponibles.">
      <button type="button" onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver a mis espacios</button>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 className="text-xl font-semibold">Datos del espacio</h2>
          <form action={updateAction} onSubmit={handleUpdateSubmit} className="mt-5 flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
            <label className="text-sm font-medium">Título
              <input name="title" required defaultValue={spot.title} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="text-sm font-medium">Ubicación
              <AddressAutocomplete value={address} onChange={setAddress} required />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-medium">Precio por hora
                <input name="pricePerHour" type="number" min={1} required defaultValue={spot.price} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
              </label>
              <label className="text-sm font-medium">Tipo de espacio
                <select name="parkingTypeId" defaultValue={spot.parkingTypeId} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm">
                  {parkingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </label>
            </div>
            <label className="text-sm font-medium">Foto del espacio
              <div className="mt-2 flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
                  {photoPreview ? <img src={photoPreview} alt="Vista previa" className="size-full object-cover" /> : spot.image ? <img src={spot.image} alt={spot.title} className="size-full object-cover" /> : <Camera className="size-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handlePhotoChange(event.currentTarget)} className="w-full overflow-hidden text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground" />
                  {photoProcessing && <p className="mt-1.5 text-xs text-muted-foreground">Optimizando imagen…</p>}
                </div>
              </div>
            </label>
            {(priceClientError ?? updateState?.error) && <p className="text-sm text-destructive">{priceClientError ?? updateState?.error}</p>}
            {!priceClientError && updateState?.success && <p className="text-sm text-accent">Cambios guardados.</p>}
            <button type="submit" disabled={updatePending || photoProcessing} className="mt-1 self-start rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{updatePending ? 'Guardando…' : photoProcessing ? 'Optimizando imagen…' : 'Guardar cambios'}</button>
          </form>
        </div>
        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-7">
          <h2 className="text-xl font-semibold">Agregar horarios disponibles</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ya tienes {spot.upcomingWindowCount} horario(s) próximos disponibles.</p>
          <form action={availabilityAction} onSubmit={handleAvailabilitySubmit} className="mt-5 flex flex-col gap-4">
            <input type="hidden" name="spotId" value={spot.id} />
            {windows.map((window, index) => <AvailabilityPicker key={index} value={window} onChange={(next) => updateWindow(index, next)} />)}
            <input type="hidden" name="availability" value={JSON.stringify(windows.map((window) => computeAvailabilityRange(window.startDate, window.startHour, window.endDate, window.endHour)))} />
            {(availabilityClientError ?? availabilityState?.error) && <p className="text-sm text-destructive">{availabilityClientError ?? availabilityState?.error}</p>}
            {!availabilityClientError && availabilityState?.success && <p className="text-sm text-accent">Horario agregado.</p>}
            <button type="submit" disabled={availabilityPending} className="self-start rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{availabilityPending ? 'Agregando…' : 'Agregar horario'}</button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
