export type Interval = { start: Date; end: Date }

export function subtractBusyRanges(window: Interval, busyRanges: Interval[]): Interval[] {
  let segments: Interval[] = [window]

  for (const busy of busyRanges) {
    const next: Interval[] = []
    for (const segment of segments) {
      if (busy.end <= segment.start || busy.start >= segment.end) {
        next.push(segment)
        continue
      }
      if (busy.start > segment.start) next.push({ start: segment.start, end: busy.start })
      if (busy.end < segment.end) next.push({ start: busy.end, end: segment.end })
    }
    segments = next
  }

  return segments.filter((segment) => segment.end > segment.start)
}
