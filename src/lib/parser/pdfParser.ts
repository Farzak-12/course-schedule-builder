import type { RawTextItem, ParsedRow } from './types'
import type { Weekday } from '@/types'
import { matchDay, normalizeRow } from './normalize'
import { nextRowId } from '@/lib/id'

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

/** Groups text items into visual rows: sorted top-to-bottom (per page), clustered by y-proximity, then left-to-right. */
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

/**
 * A "zone" is one column of one table block. `sectionCourse` is special: real-world exports
 * sometimes merge the "Şb." and "Ders Kodu" header labels into a single text run, so instead of
 * trusting a single x-anchor to separate them, everything in that zone is split by content order
 * (leftmost item on the row = section label, the rest = course code) — see splitSectionCourse.
 */
type ZoneKey = 'sectionCourse' | 'room' | 'startTime' | 'endTime' | 'title' | 'instructor'

interface Zone {
  key: ZoneKey
  x: number
}

interface TableBlock {
  xMin: number
  xMax: number
  headerY: number
  day: Weekday | ''
  /** Sorted by x ascending; first is always the sectionCourse zone. */
  zones: Zone[]
}

interface PendingTitle {
  day: Weekday
  x: number
  y: number
}

/** Classifies a single header-row item by the label it plausibly represents. Tolerant of the
 *  format's real-world inconsistencies: "Şb."/"Ders Kodu" sometimes arrive as one merged item or
 *  two separate ones, and "Derslik"/"Dersik" (typo) both occur for the room column. */
function classifyHeaderToken(rawFold: string): 'sb' | 'dersKoduOnly' | 'room' | 'time' | 'title' | 'instructor' | null {
  if (rawFold.startsWith('şb') || rawFold.startsWith('sb')) return 'sb'
  if (rawFold === 'ders kodu' || rawFold === 'course code' || rawFold === 'code') return 'dersKoduOnly'
  if (rawFold.includes('adı') || rawFold === 'ad' || rawFold.includes('course name') || rawFold.includes('course title')) {
    return 'title'
  }
  if (rawFold.includes('öğretim') || rawFold.includes('ogretim') || rawFold.includes('hoca') || rawFold.includes('instructor')) {
    return 'instructor'
  }
  if (rawFold.includes('kodu')) return 'room'
  if (rawFold.includes('saat') || rawFold.includes('time')) return 'time'
  return null
}

interface HeaderSpan {
  zones: Zone[]
  minX: number
  maxX: number
}

/** Scans a row (already x-sorted) for one or more header spans — a page can lay several
 *  day-tables side by side, each repeating the same 5-ish column headers. Returns each span
 *  found plus the set of item indices consumed as header tokens (excluded from day-title/data
 *  detection on this same row). */
function extractHeaderSpans(row: RawTextItem[]): { spans: HeaderSpan[]; consumed: Set<number> } {
  const spans: HeaderSpan[] = []
  const consumed = new Set<number>()
  let current: Zone[] | null = null

  function finalize() {
    if (current && current.some((z) => z.key === 'room') && current.some((z) => z.key === 'startTime') && current.some((z) => z.key === 'endTime')) {
      const xs = current.map((z) => z.x)
      spans.push({ zones: [...current].sort((a, b) => a.x - b.x), minX: Math.min(...xs), maxX: Math.max(...xs) })
    }
    current = null
  }

  row.forEach((item, index) => {
    const kind = classifyHeaderToken(fold(item.str))
    if (kind === 'sb') {
      finalize()
      current = [{ key: 'sectionCourse', x: item.x }]
      consumed.add(index)
    } else if (!current) {
      // Not currently inside a header span and this token doesn't start one — leave it alone.
    } else if (kind === 'dersKoduOnly') {
      consumed.add(index)
    } else if (kind === 'room') {
      if (!current.some((z) => z.key === 'room')) current.push({ key: 'room', x: item.x })
      consumed.add(index)
    } else if (kind === 'time') {
      if (!current.some((z) => z.key === 'startTime')) current.push({ key: 'startTime', x: item.x })
      else if (!current.some((z) => z.key === 'endTime')) current.push({ key: 'endTime', x: item.x })
      consumed.add(index)
    } else if (kind === 'title') {
      if (!current.some((z) => z.key === 'title')) current.push({ key: 'title', x: item.x })
      consumed.add(index)
    } else if (kind === 'instructor') {
      if (!current.some((z) => z.key === 'instructor')) current.push({ key: 'instructor', x: item.x })
      consumed.add(index)
    } else {
      // Unrecognized token while mid-span: the header run has ended (rest of row is unrelated).
      finalize()
    }
  })
  finalize()

  return { spans, consumed }
}

/** How close (in points) a day title must sit above a header, or a title above data, to count. */
const TITLE_Y_TOLERANCE = 40

function xRangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return aMin <= bMax && bMin <= aMax
}

/** Parses previously-extracted PDF text items into rows, handling schedules laid out as several
 *  day-tables side by side (and/or stacked in bands as a table's row count wraps down the page)
 *  rather than a single table with day-name divider rows. */
export function parseRawItems(items: RawTextItem[], sourceFile: string): ParsedRow[] {
  const rows = groupIntoRows(items)
  const parsed: ParsedRow[] = []

  let blocks: TableBlock[] = []
  let pendingTitles: PendingTitle[] = []
  let currentPage = rows[0]?.[0]?.pageIndex

  for (const row of rows) {
    const rowPage = row[0]?.pageIndex
    if (rowPage !== currentPage) {
      // Each page repeats its own day titles/headers in this format — start fresh per page.
      blocks = []
      pendingTitles = []
      currentPage = rowPage
    }

    const { spans, consumed } = extractHeaderSpans(row)

    for (const span of spans) {
      // Find a pending title sitting just above and roughly over this span.
      let day: Weekday | '' = ''
      const titleIndex = pendingTitles.findIndex(
        (t) => xRangesOverlap(t.x, t.x, span.minX - 5, span.maxX + 5) && t.y - row[0]!.y <= TITLE_Y_TOLERANCE,
      )
      if (titleIndex !== -1) {
        day = pendingTitles[titleIndex]!.day
        pendingTitles.splice(titleIndex, 1)
      }

      // A continuation of an existing block (same horizontal slot, table wraps/repeats its
      // header) supersedes it in place; otherwise this is a brand-new block.
      const existingIndex = blocks.findIndex((b) => xRangesOverlap(b.xMin, b.xMax, span.minX, span.maxX))
      if (existingIndex !== -1) {
        const existing = blocks[existingIndex]!
        blocks[existingIndex] = {
          ...existing,
          headerY: row[0]!.y,
          zones: span.zones,
          day: day || existing.day,
        }
      } else {
        // Tight, non-infinite bounds for now — otherwise the next new span found later in this
        // same row (e.g. the next table over) would wrongly overlap-match this one before the
        // neighbor-based recompute below gets a chance to narrow it. That recompute widens these
        // to the correct midpoints once every span in the row has been seen.
        blocks.push({ xMin: span.minX, xMax: span.maxX, headerY: row[0]!.y, day, zones: span.zones })
      }
    }

    // Re-derive xMin/xMax for every block from its neighbors' zone extents, so data rows can be
    // assigned to the right block even when several sit side by side.
    if (spans.length > 0) {
      blocks.sort((a, b) => a.zones[0]!.x - b.zones[0]!.x)
      blocks.forEach((block, i) => {
        const prev = blocks[i - 1]
        const next = blocks[i + 1]
        const firstX = block.zones[0]!.x
        const lastX = block.zones[block.zones.length - 1]!.x
        block.xMin = prev ? (prev.zones[prev.zones.length - 1]!.x + firstX) / 2 : -Infinity
        block.xMax = next ? (lastX + next.zones[0]!.x) / 2 : Infinity
      })
    }

    // Remaining (non-header) items: day-title markers, then genuine data.
    const remainingIndices = row.map((_, i) => i).filter((i) => !consumed.has(i))
    const dataIndices: number[] = []
    for (const i of remainingIndices) {
      const item = row[i]!
      const day = matchDay(fold(item.str))
      if (day) {
        pendingTitles.push({ day, x: item.x, y: item.y })
        // A title also directly updates whichever block already spans this x — this is what
        // makes the simpler "one table, day-name divider rows, no repeated header" layout work.
        const slot = blocks.find((b) => item.x >= b.xMin && item.x < b.xMax)
        if (slot) slot.day = day
      } else {
        dataIndices.push(i)
      }
    }

    if (dataIndices.length === 0) continue

    // Group the remaining items by which block they fall under, then by zone within that block.
    const byBlock = new Map<TableBlock, RawTextItem[]>()
    for (const i of dataIndices) {
      const item = row[i]!
      const block = blocks.find((b) => item.x >= b.xMin && item.x < b.xMax)
      if (!block) continue // stray text (page title, date, footer) with no table to belong to
      const list = byBlock.get(block) ?? []
      list.push(item)
      byBlock.set(block, list)
    }

    for (const [block, blockItems] of byBlock) {
      const cells: Record<Exclude<ZoneKey, 'sectionCourse'>, string[]> & { sectionCourse: RawTextItem[] } = {
        sectionCourse: [],
        room: [],
        startTime: [],
        endTime: [],
        title: [],
        instructor: [],
      }
      for (const item of blockItems) {
        let zoneKey: ZoneKey = block.zones[0]!.key
        for (const zone of block.zones) {
          if (zone.x <= item.x) zoneKey = zone.key
          else break
        }
        if (zoneKey === 'sectionCourse') cells.sectionCourse.push(item)
        else cells[zoneKey].push(item.str)
      }

      const sectionCourseSorted = [...cells.sectionCourse].sort((a, b) => a.x - b.x)
      const sectionLabelRaw = sectionCourseSorted[0]?.str.trim() ?? ''
      const courseCodeRaw = sectionCourseSorted
        .slice(1)
        .map((it) => it.str)
        .join(' ')
        .trim()
      const roomRaw = cells.room.join(' ').trim()
      const startTimeRaw = cells.startTime.join(' ').trim()
      const endTimeRaw = cells.endTime.join(' ').trim()
      const titleRaw = cells.title.join(' ').trim()
      const instructorRaw = cells.instructor.join(' ').trim()

      if (!courseCodeRaw && !startTimeRaw && !endTimeRaw) continue

      const normalized = normalizeRow({
        courseCode: courseCodeRaw,
        day: block.day,
        startTime: startTimeRaw,
        endTime: endTimeRaw,
      })

      const warnings = [...normalized.warnings]
      if (!sectionLabelRaw) warnings.push('section label missing')
      if (!roomRaw) warnings.push('room missing')
      if (!block.day) warnings.push('day could not be determined for this table')

      parsed.push({
        id: nextRowId(),
        raw: {
          sectionLabel: sectionLabelRaw,
          courseCode: courseCodeRaw,
          title: titleRaw,
          room: roomRaw,
          day: block.day,
          startTime: startTimeRaw,
          endTime: endTimeRaw,
          instructor: instructorRaw,
        },
        courseCode: normalized.courseCode,
        title: titleRaw,
        sectionLabel: sectionLabelRaw,
        room: roomRaw,
        day: normalized.day,
        startTime: startTimeRaw,
        endTime: endTimeRaw,
        instructor: instructorRaw,
        confidence: warnings.length === 0 ? 'high' : 'low',
        warnings,
        sourceFile,
        sourcePage: blockItems[0]!.pageIndex,
      })
    }
  }

  return parsed
}

export async function parsePdfFile(file: File): Promise<ParsedRow[]> {
  const items = await loadPdfTextItems(file)
  return parseRawItems(items, file.name)
}
