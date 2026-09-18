import type { Assignment, Course } from '@/types'
import { useWhatIf } from '@/hooks/useWhatIf'
import { Badge } from '@/components/common/Badge'

interface OptionalToggleBadgeProps {
  course: Course
  currentAssignment: Assignment
  courseMap: Map<string, Course>
  /** The candidate value this badge previews — OFF when currently enabled, a section id when currently disabled. */
  candidate: string
}

/** What-if badge for the optional course's on/off toggle itself (as opposed to its section choice). */
export function OptionalToggleBadge({ course, currentAssignment, courseMap, candidate }: OptionalToggleBadgeProps) {
  const whatIfClashes = useWhatIf(currentAssignment, course.code, candidate, courseMap)
  return <Badge count={whatIfClashes} />
}
