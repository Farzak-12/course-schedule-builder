import type { Weekday } from '@/types'
import type { EnrolledSection } from '@/lib/schedule'

const BYDAY: Record<Weekday, string> = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' }
const JS_WEEKDAY_INDEX: Record<Weekday, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export interface IcsExportOptions {
  /** First day the recurrence is allowed to start from (usually the term/semester start). */
  termStart: Date
  /** Last day a class may still occur on (usually the term/semester end) — inclusive. */
  termEnd: Date
  /** Shown as the imported calendar's display name (X-WR-CALNAME) in Google/Apple/Outlook. */
  calendarName?: string
}

/** The next date on/after `from` that falls on the given weekday. */
function nextDateForWeekday(day: Weekday, from: Date): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const diff = (JS_WEEKDAY_INDEX[day] - date.getDay() + 7) % 7
  date.setDate(date.getDate() + diff)
  return date
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Floating local date-time (no Z/TZID) — calendar apps interpret it in the viewer's own timezone. */
function formatFloatingDateTime(date: Date, minutesSinceMidnight: number): string {
  const d = new Date(date)
  d.setHours(Math.floor(minutesSinceMidnight / 60), minutesSinceMidnight % 60, 0, 0)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

/** End-of-day floating date-time, so a class on the term-end date itself is still included in
 *  the RRULE's UNTIL bound. */
function formatFloatingEndOfDay(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T235959`
}

function formatUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** RFC 5545 requires content lines to be folded at 75 octets; our fields are short but stay safe. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  let result = ''
  let rest = line
  while (rest.length > 75) {
    result += rest.slice(0, 75) + '\r\n '
    rest = rest.slice(75)
  }
  return result + rest
}

/** Builds an RFC 5545 .ics calendar — one recurring weekly VEVENT per class meeting, bounded to
 *  the given term date range — importable into Google Calendar, Apple Calendar, Outlook, etc. */
export function buildIcsCalendar(enrolled: EnrolledSection[], options: IcsExportOptions, now: Date = new Date()): string {
  const { termStart, termEnd, calendarName } = options
  const dtstamp = formatUtcStamp(now)
  const until = formatFloatingEndOfDay(termEnd)

  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Course Schedule Builder//EN', 'CALSCALE:GREGORIAN']
  if (calendarName) {
    lines.push(foldLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`))
  }

  let index = 0
  for (const { course, section } of enrolled) {
    for (const meeting of section.meetings) {
      const startDate = nextDateForWeekday(meeting.day, termStart)
      if (startDate.getTime() > termEnd.getTime()) continue // no occurrences fit in the term window

      index += 1
      const uid = `${section.id}-${meeting.day}-${meeting.startMin}-${index}@course-schedule-builder`
      lines.push('BEGIN:VEVENT')
      lines.push(foldLine(`UID:${uid}`))
      lines.push(`DTSTAMP:${dtstamp}`)
      lines.push(`DTSTART:${formatFloatingDateTime(startDate, meeting.startMin)}`)
      lines.push(`DTEND:${formatFloatingDateTime(startDate, meeting.endMin)}`)
      lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${until};BYDAY=${BYDAY[meeting.day]}`)
      lines.push(foldLine(`SUMMARY:${escapeIcsText(`${course.code} Şb.${section.sectionLabel}`)}`))
      if (meeting.room) lines.push(foldLine(`LOCATION:${escapeIcsText(meeting.room)}`))
      if (course.title) lines.push(foldLine(`DESCRIPTION:${escapeIcsText(course.title)}`))
      lines.push('END:VEVENT')
    }
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
