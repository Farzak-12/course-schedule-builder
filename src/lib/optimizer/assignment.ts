import type { Assignment, CoursePick } from '@/types'
import { OFF } from '@/types'

/** Converts the store's per-course picks into the flat Assignment shape the optimizer/cost fn use. */
export function picksToAssignment(picks: Record<string, CoursePick>): Assignment {
  const assignment: Assignment = {}
  for (const pick of Object.values(picks)) {
    if (pick.enabled && pick.selectedSectionId) {
      assignment[pick.courseCode] = pick.selectedSectionId
    } else {
      assignment[pick.courseCode] = OFF
    }
  }
  return assignment
}
