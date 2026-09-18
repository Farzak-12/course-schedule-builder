import type { Assignment, CandidateSlot, Course, CourseMode } from '@/types'
import { OFF } from '@/types'
import { deriveCourseMode } from '@/lib/courseMode'

export interface CandidateSlotsResult {
  baseAssignment: Assignment
  slots: CandidateSlot[]
}

/**
 * Splits the selected course set into a fixed base assignment (locked courses — exactly one
 * candidate, no reason to enumerate) and flexible candidate slots (choice/optional courses) for
 * the optimizer to search over.
 */
export function buildCandidateSlots(
  selectedCourseCodes: string[],
  courseMap: Map<string, Course>,
  modeOverrides: Record<string, CourseMode>,
): CandidateSlotsResult {
  const baseAssignment: Assignment = {}
  const slots: CandidateSlot[] = []

  for (const code of selectedCourseCodes) {
    const course = courseMap.get(code)
    if (!course) continue

    const mode = deriveCourseMode(course, modeOverrides)
    if (mode === 'locked') {
      const only = course.sections[0]
      if (only) baseAssignment[code] = only.id
      continue
    }

    const sectionIds = course.sections.map((s) => s.id)
    const candidates = mode === 'optional' ? [...sectionIds, OFF] : sectionIds
    slots.push({ courseCode: code, mode, candidates })
  }

  return { baseAssignment, slots }
}
