import type { Assignment, Course, CostResult } from '@/types'
import { computeCost } from './clashCost'

/**
 * Computes the clash cost that would result from swapping a single course's pick, against the
 * *current* picks (not the optimum) — powers the live "N clashes" badge on non-selected options
 * without re-running the full optimizer.
 */
export function simulateSwap(
  currentAssignment: Assignment,
  courseCode: string,
  candidateSectionIdOrOff: string,
  courseMap: Map<string, Course>,
): CostResult {
  const patched: Assignment = { ...currentAssignment, [courseCode]: candidateSectionIdOrOff }
  return computeCost(patched, courseMap)
}
