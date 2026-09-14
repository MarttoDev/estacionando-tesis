'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { computeAvailabilityRange, timeFormatter, toDateIso } from '@/lib/estacionando/format'

export type AvailabilityValue = { startDate: string; startHour: number; endDate: string; endHour: number }

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MAX_MONTHS_AHEAD = 11

export function AvailabilityPicker({ value, onChange, minDate, maxDate }: { value: AvailabilityValue; onChange: (value: AvailabilityValue) => void; minDate?: string; maxDate?: string }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = toDateIso(today)
  const lowerBoundIso = minDate && minDate > todayIso ? minDate : todayIso

  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toDateIso(new Date(year, month, i + 1)))]

  function handleDayClick(dateIso: string) {
    if (pendingStart === null) {
      setPendingStart(dateIso)
      onChange({ ...value, startDate: dateIso, endDate: dateIso })
    } else {
      const [startDate, endDate] = dateIso >= pendingStart ? [pendingStart, dateIso] : [dateIso, pendingStart]
      onChange({ ...value, startDate, endDate })
      setPendingStart(null)
    }
  }

  const { start, end } = computeAvailabilityRange(value.startDate, value.startHour, value.endDate, value.endHour)

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" disabled={monthOffset === 0} onClick={() => setMonthOffset((m) => Math.max(0, m - 1))} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
        <p className="text-sm font-medium capitalize">{monthDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p>
        <button type="button" aria-label="Mes siguiente" disabled={monthOffset >= MAX_MONTHS_AHEAD} onClick={() => setMonthOffset((m) => Math.min(MAX_MONTHS_AHEAD, m + 1))} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-0.5 text-center text-[11px] text-muted-foreground sm:mt-3 sm:gap-y-1">
        {WEEKDAY_LABELS.map((label, index) => <span key={index}>{label}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-0.5 sm:gap-y-1">
        {cells.map((dateIso, index) => {
          if (dateIso === null) return <span key={index} />
          const isDisabled = dateIso < lowerBoundIso || (maxDate ? dateIso > maxDate : false)
          const isStart = dateIso === value.startDate
          const isEnd = dateIso === value.endDate
          const inRange = dateIso > value.startDate && dateIso < value.endDate
          return (
            <button
              key={index}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDayClick(dateIso)}
              className={`mx-auto flex size-7 items-center justify-center rounded-full text-xs disabled:cursor-not-allowed disabled:text-muted-foreground/40 sm:size-8 ${
                isStart || isEnd ? 'bg-accent font-medium text-accent-foreground' : inRange ? 'bg-accent/15' : 'text-foreground hover:bg-muted'
              }`}
            >
              {Number(dateIso.slice(-2))}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{pendingStart ? 'Ahora elige el día de término' : 'Elige el día de inicio'}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Hora de inicio</p>
          <Stepper display={`${String(value.startHour).padStart(2, '0')}:00`} onDecrement={() => onChange({ ...value, startHour: (value.startHour + 23) % 24 })} onIncrement={() => onChange({ ...value, startHour: (value.startHour + 1) % 24 })} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Hora de término</p>
          <Stepper display={`${String(value.endHour).padStart(2, '0')}:00`} onDecrement={() => onChange({ ...value, endHour: (value.endHour + 23) % 24 })} onIncrement={() => onChange({ ...value, endHour: (value.endHour + 1) % 24 })} />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Disponible desde el <b className="text-foreground">{formatPreview(start)}</b> hasta el <b className="text-foreground">{formatPreview(end)}</b>
      </p>
    </div>
  )
}

function Stepper({ display, onDecrement, onIncrement }: { display: string; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <div className="mt-2 flex items-center justify-between rounded-xl border border-input bg-background px-2 py-1.5 sm:py-2">
      <button type="button" aria-label="Disminuir" onClick={onDecrement} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Minus className="size-3.5" /></button>
      <span className="text-sm font-medium tabular-nums">{display}</span>
      <button type="button" aria-label="Aumentar" onClick={onIncrement} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="size-3.5" /></button>
    </div>
  )
}

function formatPreview(localDateTimeString: string) {
  const date = new Date(localDateTimeString)
  return `${date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} ${timeFormatter.format(date)}`
}
