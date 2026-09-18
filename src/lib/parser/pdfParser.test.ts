import { describe, expect, it } from 'vitest'
import type { RawTextItem } from './types'
import { parseRawItems } from './pdfParser'

/** Builds one row of RawTextItem at a given y, columns spaced far enough apart to cluster cleanly. */
function row(y: number, cells: { text: string; x: number }[]): RawTextItem[] {
  return cells.map((c) => ({ str: c.text, x: c.x, y, width: 30, height: 10, pageIndex: 0 }))
}

const HEADER_Y = 800
const COLS = { section: 50, course: 100, room: 200, start: 320, end: 380 }

function dataRow(y: number, section: string, course: string, room: string, start: string, end: string) {
  return row(y, [
    { text: section, x: COLS.section },
    { text: course, x: COLS.course },
    { text: room, x: COLS.room },
    { text: start, x: COLS.start },
    { text: end, x: COLS.end },
  ])
}

function buildFixture(): RawTextItem[] {
  const items: RawTextItem[] = [
    ...row(HEADER_Y, [
      { text: 'Şb.', x: COLS.section },
      { text: 'Ders Kodu', x: COLS.course },
      { text: 'Derslik Kodu', x: COLS.room },
      { text: 'Baş.Saat', x: COLS.start },
      { text: 'Bit.Saat', x: COLS.end },
    ]),
    ...row(780, [{ text: 'Pazartesi', x: 50 }]),
    ...dataRow(760, '1', 'BA205', 'A204', '09:00', '10:50'), // single-section (locked) course
    ...dataRow(740, '1', 'COMP203', 'B101', '09:00', '10:50'), // multi-section course, section 1
    ...dataRow(720, '2', 'COMP203', 'B102', '11:00', '12:50'), // multi-section course, section 2
    ...dataRow(700, '1', 'HIST203', 'C10', '9:0', '10:00'), // malformed start time -> low confidence
    ...row(680, [{ text: 'Çarşamba', x: 50 }]),
    ...dataRow(660, '1', 'EE213', 'D20', '19:45', '21:30'), // evening section past 18:00
  ]
  return items
}

describe('parseRawItems', () => {
  const rows = parseRawItems(buildFixture(), 'fixture.pdf')

  it('extracts every data row (excluding the header and day-marker rows)', () => {
    expect(rows).toHaveLength(5)
  })

  it('assigns the correct day to rows via the day-marker state machine across both day blocks', () => {
    const ba205 = rows.find((r) => r.courseCode === 'BA205')!
    const ee213 = rows.find((r) => r.courseCode === 'EE213')!
    expect(ba205.day).toBe('Mon')
    expect(ee213.day).toBe('Wed')
  })

  it('extracts an evening section past 18:00 correctly', () => {
    const ee213 = rows.find((r) => r.courseCode === 'EE213')!
    expect(ee213.startTime).toBe('19:45')
    expect(ee213.endTime).toBe('21:30')
    expect(ee213.confidence).toBe('high')
  })

  it('extracts both sections of a multi-section course under the same course code', () => {
    const compRows = rows.filter((r) => r.courseCode === 'COMP203')
    expect(compRows).toHaveLength(2)
    expect(new Set(compRows.map((r) => r.sectionLabel))).toEqual(new Set(['1', '2']))
  })

  it('flags a malformed time as low-confidence but still surfaces the row (does not silently drop it)', () => {
    const hist = rows.find((r) => r.raw.courseCode === 'HIST203')!
    expect(hist.confidence).toBe('low')
    expect(hist.warnings.length).toBeGreaterThan(0)
  })
})
