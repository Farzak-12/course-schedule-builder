import type { Meeting } from '@/types'

/** Small deterministic string hash (djb2), good enough for stable ids — not cryptographic. */
function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

export function sectionId(courseCode: string, sectionLabel: string, meetings: Meeting[]): string {
  const meetingsKey = [...meetings]
    .sort((a, b) => a.day.localeCompare(b.day) || a.startMin - b.startMin)
    .map((m) => `${m.day}:${m.startMin}-${m.endMin}`)
    .join('|')
  return `${courseCode}#${sectionLabel}#${hash(meetingsKey)}`
}

let rowCounter = 0
export function nextRowId(): string {
  rowCounter += 1
  return `row_${rowCounter}_${Math.random().toString(36).slice(2, 8)}`
}
