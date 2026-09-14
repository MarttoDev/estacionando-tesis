'use client'

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Check, ChevronRight, FileCheck2, MapPin, Plus, Sparkles, ShieldCheck, Trash2 } from 'lucide-react'
import { PageShell } from './page-shell'
import { AvailabilityPicker, type AvailabilityValue } from './availability-picker'
import { AddressAutocomplete, type AddressValue } from './address-autocomplete'
import { createParkingSpotAction } from '@/lib/parking-spots/actions'
import { suggestPriceAction } from '@/lib/parking-spots/pricing'
import { computeAvailabilityRange, toDateIso } from '@/lib/estacionando/format'
import { compressImage } from '@/lib/estacionando/compress-image'

type ParkingTypeOption = { id: string; name: string }

function defaultWindow(): AvailabilityValue {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  return { startDate: toDateIso(start), startHour: 9, endDate: toDateIso(start), endHour: 18 }
}

export function CreateSpotWizard({ parkingTypes, onDone, onBack }: { parkingTypes: ParkingTypeOption[]; onDone: () => void; onBack?: () => void }) {
  const [step, setStep] = useState(1)
  const [preview, setPreview] = useState({ title: '', pricePerHour: '', parkingTypeId: parkingTypes[0]?.id ?? '' })
  const [address, setAddress] = useState<AddressValue>({ text: '', comuna: null, latitude: null, longitude: null })
  const [windows, setWindows] = useState<AvailabilityValue[]>([defaultWindow()])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(createParkingSpotAction, undefined)
  const [suggestState, suggestFormAction, suggestPending] = useActionState(suggestPriceAction, undefined)
  const router = useRouter()

  useEffect(() => {
    if (state && 'success' in state) router.refresh()
  }, [state, router])

  useEffect(() => {
    if (suggestState && 'success' in suggestState) {
      setPreview((prev) => ({ ...prev, pricePerHour: String(suggestState.result.suggestedPricePerHour) }))
    }
  }, [suggestState])

  function handleSuggestPrice() {
    const formData = new FormData()
    formData.set('comuna', address.comuna ?? '')
    formData.set('parkingTypeId', preview.parkingTypeId)
    startTransition(() => {
      suggestFormAction(formData)
    })
  }

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (photoProcessing) {
      event.preventDefault()
      setClientError('Espera a que termine de optimizarse la foto antes de publicar')
      setStep(1)
      return
    }

    if (!preview.title.trim() || !address.text.trim()) {
      event.preventDefault()
      setClientError('Completa el título y la comuna de tu espacio')
      setStep(1)
      return
    }

    const price = Number(preview.pricePerHour)
    if (!preview.pricePerHour || !Number.isFinite(price) || price <= 0) {
      event.preventDefault()
      setClientError('Ingresa un precio por hora mayor a 0')
      setStep(2)
      return
    }

    for (const window of windows) {
      const { start, end } = computeAvailabilityRange(window.startDate, window.startHour, window.endDate, window.endHour)
      if (new Date(end) <= new Date(start)) {
        event.preventDefault()
        setClientError('En cada horario, la hora de término debe ser posterior a la de inicio')
        setStep(2)
        return
      }
    }

    setClientError(null)
  }

  const displayError = clientError ?? (state && 'error' in state ? state.error : null)

  if (state && 'success' in state) {
    return (
      <PageShell eyebrow="Listo" title="Tu espacio está publicado" description="Ahora las personas podrán encontrarlo cuando busquen estacionamiento cerca.">
        <div className="max-w-xl rounded-3xl border border-border bg-card p-7">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Check className="size-7" /></div>
          <h2 className="mt-5 text-2xl font-semibold">{state.spot.title} · {state.spot.area}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Publicado a ${state.spot.price.toLocaleString('es-CL')} por hora.</p>
          <button onClick={onDone} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Ver mis espacios</button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow="Comparte tu espacio" title="Publica tu estacionamiento" description="Convierte ese lugar libre en ingresos, con control total de tus horarios.">
      {onBack && <button type="button" onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver a mis espacios</button>}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[.65fr_1.35fr]">
        <aside className="min-w-0 rounded-3xl border border-border bg-card p-6 text-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
          <div className="mt-7 flex flex-col gap-5">
            {[['1', 'Tu espacio'], ['2', 'Detalles'], ['3', 'Publicar']].map(([number, label]) => (
              <button key={number} type="button" onClick={() => setStep(Number(number))} className={`flex items-center gap-3 text-left text-sm ${step === Number(number) ? 'font-semibold' : 'text-muted-foreground'}`}>
                <span className={`flex size-8 items-center justify-center rounded-full border ${step >= Number(number) ? 'border-accent bg-accent text-accent-foreground' : 'border-primary-foreground/25'}`}>
                  {step > Number(number) ? <Check className="size-4" /> : number}
                </span>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-16 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Puedes editar disponibilidad y precio cuando quieras.</div>
        </aside>
        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <form action={formAction} onSubmit={handleSubmit} noValidate>
            <div className={step === 1 ? '' : 'hidden'}>
              <h2 className="text-2xl font-semibold">Cuéntanos sobre el lugar</h2>
              <p className="mt-2 text-sm text-muted-foreground">Comienza con el nombre y la ubicación de tu estacionamiento.</p>
              <label className="mt-7 block text-sm font-medium">Título del espacio
                <input name="title" required value={preview.title} onChange={(event) => setPreview((prev) => ({ ...prev, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" placeholder="Ej. Parking Las Condes" />
              </label>
              <label className="mt-5 block text-sm font-medium">Ubicación
                <AddressAutocomplete value={address} onChange={setAddress} required />
              </label>
              <label className="mt-5 block text-sm font-medium">Foto del espacio
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
                    {photoPreview ? <img src={photoPreview} alt="Vista previa" className="size-full object-cover" /> : <Camera className="size-6 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handlePhotoChange(event.currentTarget)} className="w-full overflow-hidden text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground" />
                    {photoProcessing && <p className="mt-1.5 text-xs text-muted-foreground">Optimizando imagen…</p>}
                  </div>
                </div>
              </label>
            </div>
            <div className={step === 2 ? '' : 'hidden'}>
              <h2 className="text-2xl font-semibold">Define tus condiciones</h2>
              <p className="mt-2 text-sm text-muted-foreground">Las personas verán esta información antes de reservar.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Precio por hora
                  <input name="pricePerHour" type="number" min={1} required value={preview.pricePerHour} onChange={(event) => setPreview((prev) => ({ ...prev, pricePerHour: event.target.value }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="3000" />
                </label>
                <label className="text-sm font-medium">Tipo de espacio
                  <select name="parkingTypeId" value={preview.parkingTypeId} onChange={(event) => setPreview((prev) => ({ ...prev, parkingTypeId: event.target.value }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3">
                    {parkingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3">
                <button type="button" onClick={handleSuggestPrice} disabled={suggestPending || !address.comuna} className="flex items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50">
                  <Sparkles className="size-3.5" /> {suggestPending ? 'Calculando…' : 'Sugerir precio'}
                </button>
                {!address.comuna && <p className="mt-1.5 text-xs text-muted-foreground">Elige una dirección en el paso 1 para poder sugerirte un precio.</p>}
                {suggestState && 'error' in suggestState && <p className="mt-2 text-xs text-destructive">{suggestState.error}</p>}
                {suggestState && 'success' in suggestState && (
                  <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm">
                    <p className="font-medium">Precio aplicado: ${suggestState.result.suggestedPricePerHour.toLocaleString('es-CL')} / hora</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{suggestState.result.explanation} Puedes ajustarlo si quieres.</p>
                  </div>
                )}
              </div>
              <div className="mt-7 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">¿Cuándo está disponible?</p>
                  <button type="button" onClick={() => setWindows((current) => [...current, defaultWindow()])} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"><Plus className="size-3.5" /> Agregar horario</button>
                </div>
                <div className="mt-3 flex flex-col gap-3">
                  {windows.map((window, index) => (
                    <div key={index} className="relative">
                      {windows.length > 1 && (
                        <button type="button" aria-label="Quitar horario" onClick={() => setWindows((current) => current.filter((_, i) => i !== index))} className="absolute right-3 top-3 z-10 rounded-lg bg-background p-1.5 text-muted-foreground hover:bg-muted"><Trash2 className="size-3.5" /></button>
                      )}
                      <AvailabilityPicker value={window} onChange={(next) => updateWindow(index, next)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted p-4 text-sm"><ShieldCheck className="size-5 text-accent" /> Mi espacio tendrá verificación de ubicación.</div>
            </div>
            <div className={step === 3 ? '' : 'hidden'}>
              <h2 className="text-2xl font-semibold">Revisa y publica</h2>
              <p className="mt-2 text-sm text-muted-foreground">Así se verá tu anuncio para la comunidad.</p>
              <div className="mt-7 max-w-xs overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[1.18] bg-muted">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Vista previa" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center"><Camera className="size-8 text-muted-foreground" /></div>
                  )}
                  <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium">{parkingTypes.find((type) => type.id === preview.parkingTypeId)?.name}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{preview.title || 'Sin título'}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{address.text || 'Sin comuna'}</p>
                  <p className="mt-3 text-sm tabular-nums"><b>${Number(preview.pricePerHour || 0).toLocaleString('es-CL')}</b> <span className="text-muted-foreground">/ hora</span></p>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
                {windows.map((window, index) => <li key={index}>{window.startDate} {String(window.startHour).padStart(2, '0')}:00 → {window.endDate} {String(window.endHour).padStart(2, '0')}:00</li>)}
              </ul>
              {!address.latitude && address.text.trim() && <p className="mt-3 text-xs text-muted-foreground">Tu espacio se publicará sin ubicación exacta en el mapa. Vuelve al paso 1 y elige una dirección sugerida para mostrarlo en el mapa.</p>}
              <div className="mt-5 flex items-start gap-3 text-sm text-muted-foreground"><FileCheck2 className="mt-0.5 size-4 shrink-0 text-accent" /> Al publicar confirmas que tienes permiso para ofrecer este espacio.</div>
            </div>
            <input type="hidden" name="availability" value={JSON.stringify(windows.map((window) => computeAvailabilityRange(window.startDate, window.startHour, window.endDate, window.endHour)))} />
            {displayError && <p className="mt-4 text-sm text-destructive">{displayError}</p>}
            <div className="mt-8 flex justify-end gap-3">
              {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-border px-5 py-3 text-sm font-medium">Atrás</button>}
              {step < 3
                ? <button type="button" onClick={() => setStep(step + 1)} disabled={photoProcessing} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">Continuar <ChevronRight className="size-4" /></button>
                : <button type="submit" disabled={pending || photoProcessing} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? 'Publicando…' : photoProcessing ? 'Optimizando imagen…' : 'Publicar espacio'} <ChevronRight className="size-4" /></button>}
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
