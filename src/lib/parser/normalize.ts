import type { Weekday } from '@/types'
import { parseTimeToMinutes } from '@/lib/time'

/** Turkish + common English day tokens (full and abbreviated), case-insensitive. */
const DAY_LOOKUP: Record<string, Weekday> = {
  pazartesi: 'Mon',
  pzt: 'Mon',
  mon: 'Mon',
  monday: 'Mon',
  salı: 'Tue',
  sali: 'Tue',
  sal: 'Tue',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  çarşamba: 'Wed',
  carsamba: 'Wed',
  çar: 'Wed',
  car: 'Wed',
  wed: 'Wed',
  wednesday: 'Wed',
  perşembe: 'Thu',
  persembe: 'Thu',
  per: 'Thu',
  thu: 'Thu',
  thur: 'Thu',
  thursday: 'Thu',
  cuma: 'Fri',
  cum: 'Fri',
  fri: 'Fri',
  friday: 'Fri',
  cumartesi: 'Sat',
  cmt: 'Sat',
  sat: 'Sat',
  saturday: 'Sat',
  pazar: 'Sun',
  paz: 'Sun',
  sun: 'Sun',
  sunday: 'Sun',
}

/** Normalizes Turkish uppercase (İ/I, Ş, Ğ, Ü, Ö, Ç) and casing for lookup purposes. */
function foldTurkish(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\./g, '')
}

export function matchDay(token: string): Weekday | null {
  const folded = foldTurkish(token)
  return DAY_LOOKUP[folded] ?? null
}

const COURSE_CODE_RE = /^([A-ZÇĞİÖŞÜ]{2,6})[\s-]?(\d{3})$/i

/** Normalizes a course code, tolerant of "BA205" / "BA 205" / "BA-205". Returns null if invalid. */
export function normalizeCourseCode(value: string): string | null {
  const trimmed = value.trim().toUpperCase()
  const match = COURSE_CODE_RE.exec(trimmed)
  if (!match) return null
  return `${match[1]}${match[2]}`
}

export interface TimeValidation {
  minutes: number | null
  warning?: string
}

export function validateTime(value: string, label: string): TimeValidation {
  const trimmed = value.trim()
  const minutes = parseTimeToMinutes(trimmed)
  if (minutes === null) {
    return { minutes: null, warning: `${label} unparsable: '${value}'` }
  }
  return { minutes }
}

export interface NormalizedFields {
  courseCode: string
  day: Weekday | ''
  startMin: number | null
  endMin: number | null
  warnings: string[]
}

/** Runs the shared field validators used by both the PDF and CSV/paste parsers. */
export function normalizeRow(fields: {
  courseCode: string
  day: string
  startTime: string
  endTime: string
}): NormalizedFields {
  const warnings: string[] = []

  const courseCode = normalizeCourseCode(fields.courseCode) ?? ''
  if (!courseCode) warnings.push(`course code unrecognized: '${fields.courseCode}'`)

  const day = fields.day ? matchDay(fields.day) : null
  if (fields.day && !day) warnings.push(`day unrecognized: '${fields.day}'`)

  const start = validateTime(fields.startTime, 'start time')
  if (start.warning) warnings.push(start.warning)
  const end = validateTime(fields.endTime, 'end time')
  if (end.warning) warnings.push(end.warning)

  if (start.minutes !== null && end.minutes !== null && end.minutes <= start.minutes) {
    warnings.push(`end time (${fields.endTime}) is not after start time (${fields.startTime})`)
  }

  return {
    courseCode,
    day: day ?? '',
    startMin: start.minutes,
    endMin: end.minutes,
    warnings,
  }
}
