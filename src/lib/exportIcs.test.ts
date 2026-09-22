import { describe, expect, it } from 'vitest'
import type { EnrolledSection } from '@/lib/schedule'
import { buildIcsCalendar } from './exportIcs'

function enrolled(): EnrolledSection[] {
  return [
    {
      course: { code: 'BA205', title: 'Principles of Marketing', sections: [] },
      section: {
        id: 'BA205#1',
        courseCode: 'BA205',
        sectionLabel: '1',
        meetings: [
          { day: 'Mon', startMin: 9 * 60, endMin: 10 * 60 + 50, room: 'A204' },
          { day: 'Wed', startMin: 9 * 60, endMin: 10 * 60 + 50, room: 'A204' },
        ],
        sourceRowIds: [],
      },
    },
  ]
}

describe('buildIcsCalendar', () => {
  const now = new Date(2026, 8, 22) // a Tuesday
  const ics = buildIcsCalendar(enrolled(), now)

  it('wraps content in a valid VCALENDAR with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('VERSION:2.0')
  })

  it('emits one VEVENT per meeting, not per section', () => {
    const count = ics.split('BEGIN:VEVENT').length - 1
    expect(count).toBe(2)
  })

  it('sets a weekly RRULE with the correct BYDAY for each meeting', () => {
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=15;BYDAY=MO')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=15;BYDAY=WE')
  })

  it('schedules the first Monday occurrence on or after "now", not in the past', () => {
    const match = /DTSTART:(\d{8})T0900/.exec(ics)
    expect(match).not.toBeNull()
    const dateStr = match![1]!
    const eventDate = new Date(Number(dateStr.slice(0, 4)), Number(dateStr.slice(4, 6)) - 1, Number(dateStr.slice(6, 8)))
    expect(eventDate.getTime()).toBeGreaterThanOrEqual(now.getTime())
    expect(eventDate.getDay()).toBe(1) // Monday
  })

  it('includes the course code, section, room, and title', () => {
    expect(ics).toContain('SUMMARY:BA205 Şb.1')
    expect(ics).toContain('LOCATION:A204')
    expect(ics).toContain('DESCRIPTION:Principles of Marketing')
  })

  it('escapes special characters in text fields', () => {
    const withComma: EnrolledSection[] = [
      {
        course: { code: 'X', title: 'A, B; C', sections: [] },
        section: {
          id: 's1',
          courseCode: 'X',
          sectionLabel: '1',
          meetings: [{ day: 'Fri', startMin: 540, endMin: 585 }],
          sourceRowIds: [],
        },
      },
    ]
    const escaped = buildIcsCalendar(withComma, now)
    expect(escaped).toContain('DESCRIPTION:A\\, B\\; C')
  })
})
