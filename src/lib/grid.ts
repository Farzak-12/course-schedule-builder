import type { Assignment, Course, Meeting, Weekday } from '@/types'
import { OFF, WEEKDAY_ORDER } from '@/types'

export interface GridBlock {
  sectionId: string
  courseCode: string
  sectionLabel: string
  meeting: Meeting
}

/** Resolves the current assignment into per-day lists of class blocks, and the day/time range to render. */
export function buildGridData(
  assignment: Assignment,
  courseMap: Map<string, Course>,
): { byDay: Map<Weekday, GridBlock[]>; days: Weekday[]; startMin: number; endMin: number } {
  const byDay = new Map<Weekday, GridBlock[]>()
  const starts: number[] = []
  const ends: number[] = []

  for (const [courseCode, sectionOrOff] of Object.entries(assignment)) {
    if (sectionOrOff === OFF) continue
    const course = courseMap.get(courseCode)
    const section = course?.sections.find((s) => s.id === sectionOrOff)
    if (!section) continue

    for (const meeting of section.meetings) {
      const list = byDay.get(meeting.day) ?? []
      list.push({ sectionId: section.id, courseCode, sectionLabel: section.sectionLabel, meeting })
      byDay.set(meeting.day, list)
      starts.push(meeting.startMin)
      ends.push(meeting.endMin)
    }
  }

  const days = WEEKDAY_ORDER.filter((d) => byDay.has(d))
  const defaultStart = 9 * 60
  const defaultEnd = 18 * 60
  const startMin = starts.length ? Math.min(defaultStart, ...starts) : defaultStart
  const endMin = ends.length ? Math.max(defaultEnd, ...ends) : defaultEnd

  return { byDay, days: days.length ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startMin, endMin }
}
