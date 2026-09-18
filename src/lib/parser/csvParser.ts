import type { ParsedRow } from './types'
import { normalizeRow } from './normalize'
import { nextRowId } from '@/lib/id'

const HEADER_ALIASES: Record<string, string> = {
  'şb': 'sectionLabel',
  'sb': 'sectionLabel',
  section: 'sectionLabel',
  sec: 'sectionLabel',
  'ders kodu': 'courseCode',
  course: 'courseCode',
  code: 'courseCode',
  'derslik kodu': 'room',
  derslik: 'room',
  room: 'room',
  day: 'day',
  'gün': 'day',
  gun: 'day',
  'baş.saat': 'startTime',
  'baş saat': 'startTime',
  start: 'startTime',
  'bit.saat': 'endTime',
  'bit saat': 'endTime',
  end: 'endTime',
  instructor: 'instructor',
  'öğretim üyesi': 'instructor',
}

const FIXED_ORDER = ['courseCode', 'sectionLabel', 'room', 'day', 'startTime', 'endTime', 'instructor']

function detectDelimiter(line: string): RegExp {
  if (line.includes('\t')) return /\t/
  if (line.includes(',')) return /,/
  if (line.includes(';')) return /;/
  return /\s{2,}/
}

function fold(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\.+$/, '')
}

/** Parses pasted/CSV text into rows, tolerant of tab/comma/semicolon/space-run delimiters. */
export function parseCsvText(text: string, sourceFile = 'pasted text'): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0]!)
  const firstCells = lines[0]!.split(delimiter).map((c) => c.trim())

  let columnOrder: string[]
  let dataLines: string[]
  const headerMatches = firstCells.filter((c) => HEADER_ALIASES[fold(c)]).length
  if (headerMatches >= 3) {
    columnOrder = firstCells.map((c) => HEADER_ALIASES[fold(c)] ?? '')
    dataLines = lines.slice(1)
  } else {
    columnOrder = FIXED_ORDER
    dataLines = lines
  }

  const rows: ParsedRow[] = []
  for (const line of dataLines) {
    const cells = line.split(delimiter).map((c) => c.trim())
    if (cells.every((c) => !c)) continue

    const raw: Record<string, string> = {}
    columnOrder.forEach((col, i) => {
      if (col) raw[col] = cells[i] ?? ''
    })

    const courseCodeRaw = raw.courseCode ?? ''
    const startTimeRaw = raw.startTime ?? ''
    const endTimeRaw = raw.endTime ?? ''
    const sectionLabelRaw = raw.sectionLabel ?? ''
    const roomRaw = raw.room ?? ''
    const dayRaw = raw.day ?? ''
    const instructorRaw = raw.instructor ?? ''

    if (!courseCodeRaw && !startTimeRaw && !endTimeRaw) continue

    const normalized = normalizeRow({
      courseCode: courseCodeRaw,
      day: dayRaw,
      startTime: startTimeRaw,
      endTime: endTimeRaw,
    })

    const warnings = [...normalized.warnings]
    if (headerMatches < 3) warnings.push('columns assumed by position — please verify')
    if (!sectionLabelRaw) warnings.push('section label missing')

    rows.push({
      id: nextRowId(),
      raw: {
        sectionLabel: sectionLabelRaw,
        courseCode: courseCodeRaw,
        room: roomRaw,
        day: dayRaw,
        startTime: startTimeRaw,
        endTime: endTimeRaw,
        instructor: instructorRaw,
      },
      courseCode: normalized.courseCode,
      sectionLabel: sectionLabelRaw,
      room: roomRaw,
      day: normalized.day,
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      instructor: instructorRaw,
      confidence: warnings.length === 0 ? 'high' : 'low',
      warnings,
      sourceFile,
      sourcePage: 0,
    })
  }

  return rows
}
