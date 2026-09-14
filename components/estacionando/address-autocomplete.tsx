'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { searchAddress, type GeocodingSuggestion } from '@/lib/mapbox/geocoding'

export type AddressValue = { text: string; comuna: string | null; latitude: number | null; longitude: number | null }

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Ej. Providencia, Santiago',
  required,
}: {
  value: AddressValue
  onChange: (next: AddressValue) => void
  placeholder?: string
  required?: boolean
}) {
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); abortRef.current?.abort() }, [])

  function handleInputChange(text: string) {
    onChange({ text, comuna: null, latitude: null, longitude: null })
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (text.trim().length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller
      searchAddress(text, controller.signal)
        .then((results) => setSuggestions(results))
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, 350)
  }

  function handleSelect(suggestion: GeocodingSuggestion) {
    onChange({ text: suggestion.placeName, comuna: suggestion.comuna, latitude: suggestion.latitude, longitude: suggestion.longitude })
    setSuggestions([])
    setOpen(false)
  }

  const isVerified = value.latitude !== null && value.longitude !== null

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          name="area"
          required={required}
          value={value.text}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-muted-foreground">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className={`size-4 ${isVerified ? 'text-accent' : ''}`} />}
        </span>
      </div>
      <input type="hidden" name="comuna" value={value.comuna ?? ''} />
      <input type="hidden" name="latitude" value={value.latitude ?? ''} />
      <input type="hidden" name="longitude" value={value.longitude ?? ''} />
      {!isVerified && value.text.trim().length > 0 && !open && (
        <p className="mt-1.5 text-xs text-muted-foreground">Elige una dirección de la lista para ubicarla en el mapa.</p>
      )}
      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {suggestions.map((suggestion) => (
            <button key={suggestion.id} type="button" onClick={() => handleSelect(suggestion)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{suggestion.placeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
