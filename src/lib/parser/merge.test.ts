import { describe, expect, it } from 'vitest'
import type { ParsedRow } from './types'
import { mergeRowsIntoCatalog } from './merge'

function row(overrides: Partial<ParsedRow> & { id: string }): ParsedRow {
  return {
    raw: {},
    courseCode: 'BA205',
    sectionLabel: '1',
    room: 'A204',
    day: 'Mon',
    startTime: '09:00',
    endTime: '10:50',
    instructor: '',
    confidence: 'high',
    warnings: [],
    sourceFile: 'a.pdf',
    sourcePage: 0,
    ...overrides,
  }
}

describe('mergeRowsIntoCatalog', () => {
  it('groups a section meeting on two different days into one section with two meetings', () => {
    const rows = [
      row({ id: '1', day: 'Mon' }),
      row({ id: '2', day: 'Wed' }),
    ]
    const { courses } = mergeRowsIntoCatalog(rows)
    expect(courses).toHaveLength(1)
    expect(courses[0]!.sections).toHaveLength(1)
    expect(courses[0]!.sections[0]!.meetings).toHaveLength(2)
  })

  it('dedupes an exact duplicate row (same course/section/day/start) from a re-imported file', () => {
    const rows = [
      row({ id: '1', sourceFile: 'dept-a.pdf' }),
      row({ id: '2', sourceFile: 'dept-a-reexport.pdf' }), // identical course/section/day/start
    ]
    const { courses, warnings } = mergeRowsIntoCatalog(rows)
    expect(courses[0]!.sections[0]!.meetings).toHaveLength(1)
    expect(warnings.some((w) => w.includes('duplicate'))).toBe(true)
  })

  it('drops rows with an invalid time range (end not after start) rather than crashing', () => {
    const rows = [row({ id: '1', startTime: '10:00', endTime: '09:00' })]
    const { courses } = mergeRowsIntoCatalog(rows)
    expect(courses).toHaveLength(0)
  })

  it('keeps distinct sections of the same course separate', () => {
    const rows = [
      row({ id: '1', sectionLabel: '1', room: 'A204' }),
      row({ id: '2', sectionLabel: '2', room: 'A205', startTime: '11:00', endTime: '12:50' }),
    ]
    const { courses } = mergeRowsIntoCatalog(rows)
    expect(courses[0]!.sections).toHaveLength(2)
  })
})
