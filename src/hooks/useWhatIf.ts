import { useMemo } from 'react'
import type { Assignment, Course } from '@/types'
import { simulateSwap } from '@/lib/optimizer/whatIf'

/**
 * Live "what would happen if I picked this instead" clash count for one candidate option,
 * simulated against the current picks (not the optimum) — cheap enough to call per-option.
 * Returns only the clashes that *this course's* pick would actually be part of, not the total
 * clash count for the whole schedule (which would include pre-existing clashes unrelated to
 * this particular option and make every option look equally bad).
 */
export function useWhatIf(
  currentAssignment: Assignment,
  courseCode: string,
  candidateSectionIdOrOff: string,
  courseMap: Map<string, Course>,
): number {
  return useMemo(() => {
    const cost = simulateSwap(currentAssignment, courseCode, candidateSectionIdOrOff, courseMap)
    return cost.pairs.filter((pair) => pair.aCourseCode === courseCode || pair.bCourseCode === courseCode).length
  }, [currentAssignment, courseCode, candidateSectionIdOrOff, courseMap])
}
