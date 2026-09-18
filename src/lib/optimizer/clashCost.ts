import type { Assignment, ClashPair, Course, CostResult, Meeting } from '@/types'
import { OFF } from '@/types'
import { isPartialOverlap, overlapMinutes } from '@/lib/time'

interface MeetingEntry {
  sectionId: string
  courseCode: string
  meeting: Meeting
}

function resolveMeetings(assignment: Assignment, courseMap: Map<string, Course>): MeetingEntry[] {
  const entries: MeetingEntry[] = []
  for (const [courseCode, sectionOrOff] of Object.entries(assignment)) {
    if (sectionOrOff === OFF) continue
    const course = courseMap.get(courseCode)
    const section = course?.sections.find((s) => s.id === sectionOrOff)
    if (!section) continue
    for (const meeting of section.meetings) {
      entries.push({ sectionId: section.id, courseCode, meeting })
    }
  }
  return entries
}

/**
 * Computes total clash-minutes and every clashing pair for a given assignment. This is the
 * single source of truth for "what counts as a clash" — used by brute force, what-if, and the
 * live clash list.
 */
export function computeCost(assignment: Assignment, courseMap: Map<string, Course>): CostResult {
  const entries = resolveMeetings(assignment, courseMap)

  const byDay = new Map<string, MeetingEntry[]>()
  for (const entry of entries) {
    const list = byDay.get(entry.meeting.day) ?? []
    list.push(entry)
    byDay.set(entry.meeting.day, list)
  }

  const pairs: ClashPair[] = []
  let totalClashMinutes = 0

  for (const dayEntries of byDay.values()) {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const a = dayEntries[i]!
        const b = dayEntries[j]!
        if (a.courseCode === b.courseCode) continue

        const minutes = overlapMinutes(a.meeting.startMin, a.meeting.endMin, b.meeting.startMin, b.meeting.endMin)
        if (minutes <= 0) continue

        const overlapStartMin = Math.max(a.meeting.startMin, b.meeting.startMin)
        const overlapEndMin = Math.min(a.meeting.endMin, b.meeting.endMin)
        pairs.push({
          day: a.meeting.day,
          aSectionId: a.sectionId,
          bSectionId: b.sectionId,
          aCourseCode: a.courseCode,
          bCourseCode: b.courseCode,
          overlapStartMin,
          overlapEndMin,
          overlapMinutes: minutes,
          isPartial: isPartialOverlap(a.meeting.startMin, a.meeting.endMin, b.meeting.startMin, b.meeting.endMin),
        })
        totalClashMinutes += minutes
      }
    }
  }

  return { totalClashMinutes, distinctPairCount: pairs.length, pairs }
}
