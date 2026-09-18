import { describe, expect, it } from 'vitest'
import type { Assignment, Course } from '@/types'
import { computeCost } from './clashCost'

function course(code: string, sections: { label: string; day: 'Mon' | 'Tue'; start: number; end: number }[]): Course {
  return {
    code,
    sections: sections.map((s) => ({
      id: `${code}#${s.label}`,
      courseCode: code,
      sectionLabel: s.label,
      meetings: [{ day: s.day, startMin: s.start, endMin: s.end }],
      sourceRowIds: [],
    })),
  }
}

describe('computeCost', () => {
  it('finds zero clashes when nothing overlaps', () => {
    const a = course('AAA100', [{ label: '1', day: 'Mon', start: 540, end: 630 }])
    const b = course('BBB100', [{ label: '1', day: 'Mon', start: 630, end: 720 }])
    const courseMap = new Map([
      [a.code, a],
      [b.code, b],
    ])
    const assignment: Assignment = { AAA100: a.sections[0]!.id, BBB100: b.sections[0]!.id }
    const cost = computeCost(assignment, courseMap)
    expect(cost.totalClashMinutes).toBe(0)
    expect(cost.distinctPairCount).toBe(0)
  })

  it('finds a 3-way overlap as three distinct pairs', () => {
    const a = course('AAA100', [{ label: '1', day: 'Mon', start: 540, end: 660 }])
    const b = course('BBB100', [{ label: '1', day: 'Mon', start: 540, end: 660 }])
    const c = course('CCC100', [{ label: '1', day: 'Mon', start: 540, end: 660 }])
    const courseMap = new Map([
      [a.code, a],
      [b.code, b],
      [c.code, c],
    ])
    const assignment: Assignment = {
      AAA100: a.sections[0]!.id,
      BBB100: b.sections[0]!.id,
      CCC100: c.sections[0]!.id,
    }
    const cost = computeCost(assignment, courseMap)
    expect(cost.distinctPairCount).toBe(3)
    expect(cost.totalClashMinutes).toBe(3 * 120)
  })

  it('never counts two sections of the same course against each other', () => {
    const a = course('AAA100', [{ label: '1', day: 'Mon', start: 540, end: 660 }])
    const courseMap = new Map([[a.code, a]])
    // Only one section can ever be assigned per course, so this scenario can't arise via the
    // optimizer, but computeCost itself should still never compare a course against itself.
    const assignment: Assignment = { AAA100: a.sections[0]!.id }
    const cost = computeCost(assignment, courseMap)
    expect(cost.distinctPairCount).toBe(0)
  })
})
