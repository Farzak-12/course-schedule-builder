import { describe, expect, it } from 'vitest'
import { parseCsvText } from './csvParser'
import { mergeRowsIntoCatalog } from './merge'

const HEADER = 'Ders Kodu\tŞb.\tDerslik Kodu\tDay\tBaş.Saat\tBit.Saat'
const TAB_ROWS = [
  HEADER,
  'BA205\t1\tA204\tMon\t09:00\t10:50',
  'COMP203\t1\tB101\tMon\t09:00\t10:50',
  'COMP203\t2\tB102\tMon\t11:00\t12:50',
  'EE213\t1\tD20\tWed\t19:45\t21:30',
].join('\n')

describe('parseCsvText', () => {
  it('parses tab-delimited text with a recognized header into rows', () => {
    const rows = parseCsvText(TAB_ROWS)
    expect(rows).toHaveLength(4)
    expect(rows.every((r) => r.confidence === 'high')).toBe(true)
  })

  it('parses the same data as comma- and space-delimited variants to an equivalent catalog', () => {
    const commaRows = parseCsvText(TAB_ROWS.replace(/\t/g, ','))
    const spaceRows = parseCsvText(TAB_ROWS.replace(/\t/g, '   '))

    const tabCatalog = mergeRowsIntoCatalog(parseCsvText(TAB_ROWS)).courses
    const commaCatalog = mergeRowsIntoCatalog(commaRows).courses
    const spaceCatalog = mergeRowsIntoCatalog(spaceRows).courses

    const codes = (courses: typeof tabCatalog) => courses.map((c) => c.code).sort()
    expect(codes(commaCatalog)).toEqual(codes(tabCatalog))
    expect(codes(spaceCatalog)).toEqual(codes(tabCatalog))
  })

  it('falls back to fixed column order and flags low confidence when no header is recognized', () => {
    const rows = parseCsvText('BA205\t1\tA204\tMon\t09:00\t10:50')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.confidence).toBe('low')
    expect(rows[0]!.courseCode).toBe('BA205')
  })
})
