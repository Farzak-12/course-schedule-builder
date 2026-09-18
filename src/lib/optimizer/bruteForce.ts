import type { Assignment, CandidateSlot, Course, CostResult } from '@/types'
import { computeCost } from './clashCost'

export interface OptimizeResult {
  assignment: Assignment
  cost: CostResult
}

/** Above this many combinations, brute force is skipped in favor of the hill-climb fallback. */
const BRUTE_FORCE_COMBINATION_LIMIT = 50_000

function combinationCount(slots: CandidateSlot[]): number {
  return slots.reduce((total, slot) => total * Math.max(slot.candidates.length, 1), 1)
}

/** Enumerates every combination of candidate picks via an iterative odometer (no recursion). */
function* enumerateCombinations(slots: CandidateSlot[]): Generator<string[]> {
  if (slots.length === 0) {
    yield []
    return
  }
  const indices = slots.map(() => 0)
  while (true) {
    yield slots.map((slot, i) => slot.candidates[indices[i]!]!)

    let cursor = slots.length - 1
    while (cursor >= 0) {
      indices[cursor]!++
      if (indices[cursor]! < slots[cursor]!.candidates.length) break
      indices[cursor] = 0
      cursor--
    }
    if (cursor < 0) break
  }
}

function isBetter(candidate: CostResult, best: CostResult): boolean {
  if (candidate.totalClashMinutes !== best.totalClashMinutes) {
    return candidate.totalClashMinutes < best.totalClashMinutes
  }
  return candidate.distinctPairCount < best.distinctPairCount
}

function bruteForceSearch(
  baseAssignment: Assignment,
  slots: CandidateSlot[],
  courseMap: Map<string, Course>,
): OptimizeResult {
  let best: OptimizeResult | null = null
  for (const combination of enumerateCombinations(slots)) {
    const assignment: Assignment = { ...baseAssignment }
    slots.forEach((slot, i) => {
      assignment[slot.courseCode] = combination[i]!
    })
    const cost = computeCost(assignment, courseMap)
    if (!best || isBetter(cost, best.cost)) {
      best = { assignment, cost }
    }
  }
  return best ?? { assignment: baseAssignment, cost: computeCost(baseAssignment, courseMap) }
}

/** Greedy hill-climb fallback for when the combination space is too large to brute-force. */
function hillClimbSearch(
  baseAssignment: Assignment,
  slots: CandidateSlot[],
  courseMap: Map<string, Course>,
): OptimizeResult {
  let assignment: Assignment = { ...baseAssignment }
  slots.forEach((slot) => {
    assignment[slot.courseCode] = slot.candidates[0]!
  })
  let cost = computeCost(assignment, courseMap)

  let improved = true
  let iterations = 0
  const maxIterations = slots.length * 25
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    for (const slot of slots) {
      const currentValue = assignment[slot.courseCode]
      for (const candidate of slot.candidates) {
        if (candidate === currentValue) continue
        const trial: Assignment = { ...assignment, [slot.courseCode]: candidate }
        const trialCost = computeCost(trial, courseMap)
        if (isBetter(trialCost, cost)) {
          assignment = trial
          cost = trialCost
          improved = true
        }
      }
    }
  }
  return { assignment, cost }
}

/** Signature capturing everything that changes the search space (not the full catalog). */
export function candidateSlotsSignature(slots: CandidateSlot[]): string {
  return JSON.stringify(
    [...slots]
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
      .map((s) => [s.courseCode, s.mode, [...s.candidates].sort()]),
  )
}

const memo = new Map<string, OptimizeResult>()

/**
 * Finds the assignment that minimizes total clash-minutes (tie-break: fewer distinct clashing
 * pairs, then first-found) across every combination of the given candidate slots, folded onto a
 * fixed base assignment (locked courses). Memoized on the search-space signature.
 */
export function findOptimalAssignment(
  baseAssignment: Assignment,
  slots: CandidateSlot[],
  courseMap: Map<string, Course>,
): OptimizeResult {
  const signature = `${JSON.stringify(baseAssignment)}::${candidateSlotsSignature(slots)}`
  const cached = memo.get(signature)
  if (cached) return cached

  const result =
    combinationCount(slots) <= BRUTE_FORCE_COMBINATION_LIMIT
      ? bruteForceSearch(baseAssignment, slots, courseMap)
      : hillClimbSearch(baseAssignment, slots, courseMap)

  memo.set(signature, result)
  return result
}

export function clearOptimizerMemo(): void {
  memo.clear()
}
