import type { Course, CoursePick, Section } from '@/types'

export interface EnrolledSection {
  course: Course
  section: Section
}

/** Every course/section the student is actually enrolled in right now (enabled, with a chosen
 *  section) — the single source of truth for the schedule summary, PDF, and ICS export. */
export function getEnrolledSections(courses: Map<string, Course>, picks: Record<string, CoursePick>): EnrolledSection[] {
  const enrolled: EnrolledSection[] = []
  for (const pick of Object.values(picks)) {
    if (!pick.enabled || !pick.selectedSectionId) continue
    const course = courses.get(pick.courseCode)
    const section = course?.sections.find((s) => s.id === pick.selectedSectionId)
    if (!course || !section) continue
    enrolled.push({ course, section })
  }
  return enrolled.sort((a, b) => a.course.code.localeCompare(b.course.code))
}
