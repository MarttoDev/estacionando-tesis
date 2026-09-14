export const dateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' })
export const timeFormatter = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' })

export function formatWindow(startTime: Date, endTime: Date) {
  return `${dateFormatter.format(startTime)}, ${timeFormatter.format(startTime)}–${timeFormatter.format(endTime)}`
}

export function formatReservationRange(startTime: Date, endTime: Date) {
  const sameDay = startTime.toDateString() === endTime.toDateString()
  if (sameDay) {
    return `${dateFormatter.format(startTime)}, ${timeFormatter.format(startTime)} – ${timeFormatter.format(endTime)}`
  }
  return `${dateFormatter.format(startTime)} ${timeFormatter.format(startTime)} → ${dateFormatter.format(endTime)} ${timeFormatter.format(endTime)}`
}

const shortDateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })

export function formatWindowShort(startTime: Date, endTime: Date) {
  const sameDay = startTime.toDateString() === endTime.toDateString()
  if (sameDay) {
    return `${shortDateFormatter.format(startTime)} ${timeFormatter.format(startTime)}–${timeFormatter.format(endTime)}`
  }
  return `${shortDateFormatter.format(startTime)} ${timeFormatter.format(startTime)} → ${shortDateFormatter.format(endTime)} ${timeFormatter.format(endTime)}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toLocalDateTimeString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toDateIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function computeAvailabilityRange(startDate: string, startHour: number, endDate: string, endHour: number) {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd, startHour, 0, 0, 0)
  const end = new Date(ey, em - 1, ed, endHour, 0, 0, 0)
  return { start: toLocalDateTimeString(start), end: toLocalDateTimeString(end) }
}
