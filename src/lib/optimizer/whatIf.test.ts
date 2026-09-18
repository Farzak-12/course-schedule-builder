import { describe, expect, it } from 'vitest'
import type { Assignment, Course } from '@/types'
import { simulateSwap } from './whatIf'
import { computeCost } from './clashCost'

function section(id: string, courseCode: string, label: string, day: 'Mon', start: number, end: number) {
  return { id, courseCode, sectionLabel: label, meetings: [{ day, startMin: start, endMin: end }], sourceRowIds: [] }
}

describe('simulateSwap', () => {
  it('matches computeCost on a manually patched assignment (equivalence, not just plausibility)', () => {
    const a: Course = { code: 'A', sections: [section('A#1', 'A', '1', 'Mon', 540, 600)] }
    const b: Course = {
      code: 'B',
      sections: [section('B#1', 'B', '1', 'Mon', 540, 600), section('B#2', 'B', '2', 'Mon', 660, 720)],
    }
    const courseMap = new Map([
      [a.code, a],
      [b.code, b],
    ])
    const current: Assignment = { A: 'A#1', B: 'B#2' }

    const simulated = simulateSwap(current, 'B', 'B#1', courseMap)
    const manuallyPatched = computeCost({ ...current, B: 'B#1' }, courseMap)

    expect(simulated).toEqual(manuallyPatched)
    expect(simulated.distinctPairCount).toBe(1)
  })

  it('does not mutate the original assignment', () => {
    const a: Course = { code: 'A', sections: [section('A#1', 'A', '1', 'Mon', 540, 600)] }
    const courseMap = new Map([[a.code, a]])
    const current: Assignment = { A: 'A#1' }
    simulateSwap(current, 'A', 'OFF', courseMap)
    expect(current.A).toBe('A#1')
  })
})
