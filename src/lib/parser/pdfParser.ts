import type { RawTextItem, ParsedRow } from './types'
import { matchDay, normalizeRow } from './normalize'
import { nextRowId } from '@/lib/id'

/** Known header tokens for the "Bölüm Ders Programı" column format, folded to lowercase w/o punctuation. */
const HEADER_TOKENS: { key: ColumnKey; tokens: string[] }[] = [
  { key: 'sectionLabel', tokens: ['şb', 'sb', 'section', 'sec'] },
  { key: 'courseCode', tokens: ['ders kodu', 'derskodu', 'course code', 'code'] },
  { key: 'room', tokens: ['derslik kodu', 'dersliknodu', 'derslik', 'room'] },
  { key: 'startTime', tokens: ['baş.saat', 'baş saat', 'başsaat', 'bassaat', 'start'] },
  { key: 'endTime', tokens: ['bit.saat', 'bit saat', 'bitsaat', 'end'] },
  { key: 'instructor', tokens: ['öğretim üyesi', 'ogretim uyesi', 'instructor', 'öğretim', 'hoca'] },
  { key: 'day', tokens: ['gün', 'gun', 'day'] },
]

type ColumnKey = 'sectionLabel' | 'courseCode' | 'room' | 'startTime' | 'endTime' | 'instructor' | 'day'

function fold(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\.+$/, '')
}

/** Loads a PDF file client-side and extracts positioned text items from every page, via pdfjs-dist. */
export async function loadPdfTextItems(file: File): Promise<RawTextItem[]> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default

  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise

  const items: RawTextItem[] = []
  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex++) {
    const page = await doc.getPage(pageIndex + 1)
    const content = await page.getTextContent()
    for (const raw of content.items) {
      if (!('str' in raw) || !raw.str.trim()) continue
      const transform = raw.transform as number[]
      items.push({
        str: raw.str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: raw.width ?? 0,
        height: Math.abs(transform[3] ?? 10),
        pageIndex,
      })
    }
  }
  return items
}

/** Groups text items into visual rows: sorted top-to-bottom, clustered by y-proximity, then left-to-right. */
function groupIntoRows(items: RawTextItem[]): RawTextItem[][] {
  const byPage = new Map<number, RawTextItem[]>()
  for (const item of items) {
    const list = byPage.get(item.pageIndex) ?? []
    list.push(item)
    byPage.set(item.pageIndex, list)
  }

  const rows: RawTextItem[][] = []
  for (const pageItems of byPage.values()) {
    const sorted = [...pageItems].sort((a, b) => b.y - a.y)
    let currentRow: RawTextItem[] = []
    let currentY: number | null = null
    for (const item of sorted) {
      const tolerance = Math.max(item.height, 8) * 0.5
      if (currentY === null || Math.abs(item.y - currentY) <= tolerance) {
        currentRow.push(item)
        currentY = currentY === null ? item.y : (currentY + item.y) / 2
      } else {
        rows.push(currentRow.sort((a, b) => a.x - b.x))
        currentRow = [item]
        currentY = item.y
      }
    }
    if (currentRow.length) rows.push(currentRow.sort((a, b) => a.x - b.x))
  }
  return rows
}

interface ColumnBoundary {
  key: ColumnKey
  start: number
}

/** Scans a row for header tokens; returns column boundaries (sorted by x) if enough are found. */
function detectHeaderColumns(row: RawTextItem[]): ColumnBoundary[] | null {
  const boundaries: ColumnBoundary[] = []
  // Header labels can span 1-2 adjacent items (e.g. "Ders" "Kodu"), so also try pairwise joins.
  const candidates: { text: string; x: number }[] = row.map((it) => ({ text: fold(it.str), x: it.x }))
  for (let i = 0; i < row.length - 1; i++) {
    candidates.push({ text: `${fold(row[i]!.str)} ${fold(row[i + 1]!.str)}`, x: row[i]!.x })
  }

  for (const { key, tokens } of HEADER_TOKENS) {
    const found = candidates.find((c) => tokens.some((t) => c.text === t || c.text.includes(t)))
    if (found) boundaries.push({ key, start: found.x })
  }

  if (boundaries.length < 3) return null
  return boundaries.sort((a, b) => a.start - b.start)
}

/** Simple 1D clustering fallback: splits x-positions into columns wherever the gap exceeds a threshold. */
function clusterColumns(rows: RawTextItem[][]): ColumnBoundary[] {
  const xs = [...new Set(rows.flatMap((r) => r.map((it) => it.x)))].sort((a, b) => a - b)
  const boundaries: number[] = []
  let last: number | null = null
  for (const x of xs) {
    if (last === null || x - last > 30) boundaries.push(x)
    last = x
  }
  // Fallback columns get generic keys in the expected left-to-right field order.
  const fallbackOrder: ColumnKey[] = ['sectionLabel', 'courseCode', 'room', 'startTime', 'endTime', 'instructor']
  return boundaries.slice(0, fallbackOrder.length).map((start, i) => ({ key: fallbackOrder[i]!, start }))
}

function assignColumn(x: number, boundaries: ColumnBoundary[]): ColumnKey {
  let best = boundaries[0]!
  for (const b of boundaries) {
    if (b.start <= x) best = b
    else break
  }
  return best.key
}

/** Parses previously-extracted PDF text items into rows using the department schedule's column layout. */
export function parseRawItems(items: RawTextItem[], sourceFile: string): ParsedRow[] {
  const rows = groupIntoRows(items)
  const parsed: ParsedRow[] = []

  let boundaries: ColumnBoundary[] | null = null
  let currentDay: string = ''
  let headerRowIndex = -1

  for (let i = 0; i < rows.length; i++) {
    const detected = detectHeaderColumns(rows[i]!)
    if (detected) {
      boundaries = detected
      headerRowIndex = i
      break
    }
  }
  if (!boundaries) boundaries = clusterColumns(rows)

  for (let i = 0; i < rows.length; i++) {
    if (i === headerRowIndex) continue
    const row = rows[i]!
    if (row.length === 0) continue

    // A lone row whose only content matches a day name is a day-block divider, not data.
    if (row.length <= 2) {
      const joined = fold(row.map((it) => it.str).join(' '))
      const day = matchDay(joined)
      if (day) {
        currentDay = joined
        continue
      }
    }

    const cells: Record<ColumnKey, string[]> = {
      sectionLabel: [],
      courseCode: [],
      room: [],
      startTime: [],
      endTime: [],
      instructor: [],
      day: [],
    }
    for (const item of row) {
      const key = assignColumn(item.x, boundaries)
      cells[key].push(item.str)
    }

    const courseCodeRaw = cells.courseCode.join(' ').trim()
    const startTimeRaw = cells.startTime.join(' ').trim()
    const endTimeRaw = cells.endTime.join(' ').trim()
    const sectionLabelRaw = cells.sectionLabel.join(' ').trim()
    const roomRaw = cells.room.join(' ').trim()
    const instructorRaw = cells.instructor.join(' ').trim()
    const dayRaw = cells.day.join(' ').trim() || currentDay

    // Skip rows that don't look like data at all (e.g. stray page furniture, blank lines).
    if (!courseCodeRaw && !startTimeRaw && !endTimeRaw) continue

    const normalized = normalizeRow({
      courseCode: courseCodeRaw,
      day: dayRaw,
      startTime: startTimeRaw,
      endTime: endTimeRaw,
    })

    const warnings = [...normalized.warnings]
    if (!sectionLabelRaw) warnings.push('section label missing')
    if (!roomRaw) warnings.push('room missing')

    parsed.push({
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
      sourcePage: row[0]!.pageIndex,
    })
  }

  return parsed
}

export async function parsePdfFile(file: File): Promise<ParsedRow[]> {
  const items = await loadPdfTextItems(file)
  return parseRawItems(items, file.name)
}
