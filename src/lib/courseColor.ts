const PALETTE_SIZE = 8

/** Stable hash so a course's accent color never changes between renders/reloads. */
function hashCode(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h
}

/** Returns this course's CSS color value (e.g. for inline styles), stable per course code. */
export function courseColor(courseCode: string): string {
  const index = (hashCode(courseCode) % PALETTE_SIZE) + 1
  return `var(--course-${index})`
}

/** Same color, as a Tailwind class suffix (e.g. "course-3") for bg-/text-/border- utilities. */
export function courseColorToken(courseCode: string): string {
  const index = (hashCode(courseCode) % PALETTE_SIZE) + 1
  return `course-${index}`
}
