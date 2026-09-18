import type { Course, CourseMode } from '@/types'

/**
 * Derives a course's mode: single-section courses are always locked (no user choice possible);
 * multi-section courses are 'choice' (mandatory) unless the student has explicitly marked them
 * 'optional' via modeOverrides.
 */
export function deriveCourseMode(course: Course, modeOverrides: Record<string, CourseMode>): CourseMode {
  if (course.sections.length <= 1) return 'locked'
  return modeOverrides[course.code] === 'optional' ? 'optional' : 'choice'
}
