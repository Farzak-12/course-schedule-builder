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

/**
 * Modeled on a real "Bölüm Ders Programı" export (coordinates taken from an actual pdfjs-dist
 * extraction): day-tables are laid out SIDE BY SIDE across the page width, each repeating its
 * own "Şb./Ders Kodu/Derslik Kodu/Baş.Saat/Bit.Saat" header — not one table with day-name
 * divider rows. The real file also mixes merged ("Şb. Ders Kodu" as one text run) and split
 * ("Şb." + "Ders Kodu" as two runs) header tokenization for the same logical columns, has a
 * "Derslik" -> "Dersik" typo in one header, and appends a trailing letter to some end times
 * (e.g. "10:45u", apparently marking distance/online sections).
 */
function realWorldFixture(): RawTextItem[] {
  return [
    // Day titles for the two side-by-side tables.
    ...row(523.44, [
      { text: 'Pazartesi', x: 112.95 },
      { text: 'Salı', x: 319.42 },
    ]),
    // Headers: Pazartesi's are split tokens; Salı's room header has the real "Dersik" typo.
    ...row(512.1, [
      { text: 'Şb.', x: 31.09 },
      { text: 'Ders Kodu', x: 44.18 },
      { text: 'Derslik Kodu', x: 100.88 },
      { text: 'Başl.Saat', x: 160.5 },
      { text: 'Bit.Saat', x: 198.45 },
      { text: 'Şb.', x: 229.52 },
      { text: 'Ders Kodu', x: 242.61 },
      { text: 'Dersik Kodu', x: 299.3 },
      { text: 'Baş.Saat', x: 360.45 },
      { text: 'Bit.Saat', x: 396.87 },
    ]),
    ...row(500.94, [
      { text: '1', x: 31.09 },
      { text: 'TURK101', x: 44.18 },
      { text: 'RKON', x: 100.88 },
      { text: '09:00', x: 160.5 },
      { text: '09:45', x: 198.45 },
      { text: '1', x: 229.52 },
      { text: 'EE203', x: 242.61 },
      { text: 'F0F18', x: 299.3 },
      { text: '12:00', x: 368.94 },
      { text: '12:45', x: 402.62 },
    ]),
    // A trailing-letter end time ("10:45u") on the Pazartesi side — should still parse cleanly.
    ...row(489.6, [
      { text: '1', x: 31.09 },
      { text: 'COMP205', x: 44.18 },
      { text: 'B238', x: 100.88 },
      { text: '10:00', x: 160.5 },
      { text: '10:45u', x: 198.45 },
    ]),
    // A new title + a MERGED "Şb. Ders Kodu" header reusing Pazartesi's column position further
    // down the page — a same-slot continuation that supersedes it with a new day (Cuma).
    ...row(268.33, [{ text: 'Cuma', x: 117.69 }]),
    ...row(257.16, [
      { text: 'Şb. Ders Kodu', x: 31.09 },
      { text: 'Derslik Kodu', x: 100.88 },
      { text: 'Baş.Saat', x: 162.03 },
      { text: 'Bit.Saat', x: 198.45 },
    ]),
    ...row(245.82, [
      { text: '2', x: 31.09 },
      { text: 'SGN230', x: 44.18 },
      { text: 'F0F14', x: 100.88 },
      { text: '09:00', x: 170.52 },
      { text: '09:45', x: 204.19 },
    ]),
  ]
}

describe('parseRawItems (real-world multi-column layout)', () => {
  const rows = parseRawItems(realWorldFixture(), 'real.pdf')

  it('does not smear cells from side-by-side tables together', () => {
    expect(rows.every((r) => r.confidence === 'high')).toBe(true)
    expect(rows).toHaveLength(4)
  })

  it('assigns each side-by-side table its own day, course code, and section', () => {
    const turk = rows.find((r) => r.courseCode === 'TURK101')!
    const ee = rows.find((r) => r.courseCode === 'EE203')!
    expect(turk.day).toBe('Mon')
    expect(turk.sectionLabel).toBe('1')
    expect(turk.room).toBe('RKON')
    expect(ee.day).toBe('Tue')
    expect(ee.room).toBe('F0F18')
  })

  it('tolerates a trailing letter on a time value instead of flagging it low-confidence', () => {
    const comp = rows.find((r) => r.courseCode === 'COMP205')!
    expect(comp.endTime).toBe('10:45u')
    expect(comp.confidence).toBe('high')
  })

  it('treats a same-column continuation header (possibly merged "Şb. Ders Kodu") as a new block with its own day', () => {
    const sgn = rows.find((r) => r.courseCode === 'SGN230')!
    expect(sgn.day).toBe('Fri')
    expect(sgn.sectionLabel).toBe('2')
    expect(sgn.room).toBe('F0F14')
  })
})
