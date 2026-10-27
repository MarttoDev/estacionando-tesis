const SANTIAGO_TZ = 'America/Santiago'

export const dateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', timeZone: SANTIAGO_TZ })
export const timeFormatter = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: SANTIAGO_TZ })

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: SANTIAGO_TZ })

/** Whether two instants fall on the same calendar day in Santiago — never the server's or browser's own timezone. */
function sameDayInSantiago(a: Date, b: Date) {
  return dayKeyFormatter.format(a) === dayKeyFormatter.format(b)
}

export function formatWindow(startTime: Date, endTime: Date) {
  return `${dateFormatter.format(startTime)}, ${timeFormatter.format(startTime)}–${timeFormatter.format(endTime)}`
}

export function formatReservationRange(startTime: Date, endTime: Date) {
  if (sameDayInSantiago(startTime, endTime)) {
    return `${dateFormatter.format(startTime)}, ${timeFormatter.format(startTime)} – ${timeFormatter.format(endTime)}`
  }
  return `${dateFormatter.format(startTime)} ${timeFormatter.format(startTime)} → ${dateFormatter.format(endTime)} ${timeFormatter.format(endTime)}`
}

export const shortDateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: SANTIAGO_TZ })

export function formatWindowShort(startTime: Date, endTime: Date) {
  if (sameDayInSantiago(startTime, endTime)) {
    return `${shortDateFormatter.format(startTime)} ${timeFormatter.format(startTime)}–${timeFormatter.format(endTime)}`
  }
  return `${shortDateFormatter.format(startTime)} ${timeFormatter.format(startTime)} → ${shortDateFormatter.format(endTime)} ${timeFormatter.format(endTime)}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toDateIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const santiagoPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SANTIAGO_TZ,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23',
})

/** The offset (in minutes, `local - UTC`) America/Santiago is at for the instant `at` — Chile's
 * DST rules make this vary through the year, so it can't be hardcoded. */
function santiagoOffsetMinutes(at: Date) {
  const parts = santiagoPartsFormatter.formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asIfUtc - at.getTime()) / 60_000
}

/** Turns a wall-clock date + hour that the picker UI always means in America/Santiago into the
 * exact UTC instant it represents. `new Date(y, m, d, h)` would instead use whichever timezone
 * the JS engine constructing it happens to run in — fine while that's the user's own browser,
 * but once the resulting string crosses the network to the server it gets re-parsed in the
 * *server's* local timezone (UTC in production), silently shifting every booking by Chile's
 * UTC offset. Returns a `Z`-suffixed ISO string, which every environment parses identically.
 */
function zonedSantiagoToUtcIso(dateIso: string, hour: number) {
  const [y, m, d] = dateIso.split('-').map(Number)
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hour, 0, 0))
  const offsetMinutes = santiagoOffsetMinutes(utcGuess)
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000).toISOString()
}

export function computeAvailabilityRange(startDate: string, startHour: number, endDate: string, endHour: number) {
  return { start: zonedSantiagoToUtcIso(startDate, startHour), end: zonedSantiagoToUtcIso(endDate, endHour) }
}
