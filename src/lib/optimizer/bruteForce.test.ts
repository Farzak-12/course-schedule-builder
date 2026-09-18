import { describe, expect, it } from 'vitest'
import type { Assignment, CandidateSlot, Course } from '@/types'
import { findOptimalAssignment, clearOptimizerMemo } from './bruteForce'
import { computeCost } from './clashCost'

function section(id: string, courseCode: string, label: string, day: 'Mon' | 'Tue', start: number, end: number) {
  return { id, courseCode, sectionLabel: label, meetings: [{ day, startMin: start, endMin: end }], sourceRowIds: [] }
}

describe('findOptimalAssignment', () => {
  it('picks the section combination with the fewest clash-minutes, not just the first candidate', () => {
    // FIXED has one fixed meeting Mon 09:00-10:00.
    // FLEX has two sections: 'bad' fully overlaps FIXED, 'good' does not overlap at all.
    const fixed: Course = { code: 'FIXED', sections: [section('FIXED#1', 'FIXED', '1', 'Mon', 540, 600)] }
    const flex: Course = {
      code: 'FLEX',
      sections: [
        section('FLEX#bad', 'FLEX', 'bad', 'Mon', 540, 600),
        section('FLEX#good', 'FLEX', 'good', 'Mon', 600, 660),
      ],
    }
    const courseMap = new Map([
      [fixed.code, fixed],
      [flex.code, flex],
    ])
    const baseAssignment: Assignment = { FIXED: 'FIXED#1' }
    const slots: CandidateSlot[] = [{ courseCode: 'FLEX', mode: 'choice', candidates: ['FLEX#bad', 'FLEX#good'] }]

    clearOptimizerMemo()
    const result = findOptimalAssignment(baseAssignment, slots, courseMap)
    expect(result.assignment.FLEX).toBe('FLEX#good')
    expect(result.cost.totalClashMinutes).toBe(0)
  })

  it('tie-breaks on fewer distinct clashing pairs when total clash-minutes are equal', () => {
    // Option A: one 60-minute clash against a single other course (1 pair, 60 min).
    // Option B: two 30-minute clashes against two other courses (2 pairs, 60 min total).
    // Both cost 60 clash-minutes; A must win because it has fewer distinct pairs.
    const other1: Course = { code: 'OTHER1', sections: [section('OTHER1#1', 'OTHER1', '1', 'Mon', 540, 600)] }
    const other2: Course = { code: 'OTHER2', sections: [section('OTHER2#1', 'OTHER2', '1', 'Mon', 630, 690)] }
    const flex: Course = {
      code: 'FLEX',
      sections: [
        section('FLEX#A', 'FLEX', 'A', 'Mon', 540, 600), // fully overlaps OTHER1 only: 1 pair, 60 min
        section('FLEX#B', 'FLEX', 'B', 'Mon', 570, 660), // overlaps OTHER1 30min + OTHER2 30min: 2 pairs, 60 min
      ],
    }
    const courseMap = new Map([
      [other1.code, other1],
      [other2.code, other2],
      [flex.code, flex],
    ])
    const baseAssignment: Assignment = { OTHER1: 'OTHER1#1', OTHER2: 'OTHER2#1' }
    const slots: CandidateSlot[] = [{ courseCode: 'FLEX', mode: 'choice', candidates: ['FLEX#A', 'FLEX#B'] }]

    clearOptimizerMemo()
    const result = findOptimalAssignment(baseAssignment, slots, courseMap)
    expect(result.assignment.FLEX).toBe('FLEX#A')
    expect(result.cost.distinctPairCount).toBe(1)
  })

  it('matches a brute-force-by-hand check over every combination for a small multi-course case', () => {
    const c1: Course = {
      code: 'C1',
      sections: [section('C1#1', 'C1', '1', 'Mon', 540, 600), section('C1#2', 'C1', '2', 'Mon', 600, 660)],
    }
    const c2: Course = {
      code: 'C2',
      sections: [section('C2#1', 'C2', '1', 'Mon', 570, 630), section('C2#2', 'C2', '2', 'Mon', 660, 720)],
    }
    const courseMap = new Map([
      [c1.code, c1],
      [c2.code, c2],
    ])
    const slots: CandidateSlot[] = [
      { courseCode: 'C1', mode: 'choice', candidates: ['C1#1', 'C1#2'] },
      { courseCode: 'C2', mode: 'choice', candidates: ['C2#1', 'C2#2'] },
    ]

    clearOptimizerMemo()
    const result = findOptimalAssignment({}, slots, courseMap)

    let bestCost = Infinity
    for (const c1id of ['C1#1', 'C1#2']) {
      for (const c2id of ['C2#1', 'C2#2']) {
        const cost = computeCost({ C1: c1id, C2: c2id }, courseMap)
        bestCost = Math.min(bestCost, cost.totalClashMinutes)
      }
    }
    expect(result.cost.totalClashMinutes).toBe(bestCost)
  })
})
