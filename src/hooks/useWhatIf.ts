import { useMemo } from 'react'
import type { Assignment, Course } from '@/types'
import { simulateSwap } from '@/lib/optimizer/whatIf'

/**
 * Live "what would happen if I picked this instead" clash count for one candidate option,
 * simulated against the current picks (not the optimum) — cheap enough to call per-option.
 * Returns the number of distinct clashing pairs that swap would produce.
 */
export function useWhatIf(
  currentAssignment: Assignment,
  courseCode: string,
  candidateSectionIdOrOff: string,
  courseMap: Map<string, Course>,
): number {
  return useMemo(
    () => simulateSwap(currentAssignment, courseCode, candidateSectionIdOrOff, courseMap).distinctPairCount,
    [currentAssignment, courseCode, candidateSectionIdOrOff, courseMap],
  )
}
