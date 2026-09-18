/** Parses "HH:MM" (or "H:MM") into minutes since midnight. Returns null if malformed. */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours * 60 + minutes
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Overlap in minutes between two [start,end) ranges; 0 if disjoint. */
export function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

/** True when neither range fully contains the other. */
export function isPartialOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  const aContainsB = aStart <= bStart && aEnd >= bEnd
  const bContainsA = bStart <= aStart && bEnd >= aEnd
  return !aContainsB && !bContainsA
}
