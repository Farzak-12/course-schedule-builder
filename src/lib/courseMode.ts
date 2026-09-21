import type { Course, CourseMode } from '@/types'

/**
 * Derives a course's mode: a student-set 'optional' override always wins (any course, even a
 * single-section one, can be marked droppable); otherwise single-section courses default to
 * locked (no choice to make) and multi-section ones default to 'choice' (mandatory).
 */
export function deriveCourseMode(course: Course, modeOverrides: Record<string, CourseMode>): CourseMode {
  if (modeOverrides[course.code] === 'optional') return 'optional'
  return course.sections.length <= 1 ? 'locked' : 'choice'
}
