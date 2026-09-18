import type { Course, Meeting, Section, Weekday } from '@/types'
import { sectionId } from '@/lib/id'
import { parseTimeToMinutes } from '@/lib/time'
import type { ParsedRow } from './types'

export interface MergeResult {
  courses: Course[]
  warnings: string[]
}

/**
 * Builds a Course[] catalog from confirmed (user-corrected) rows. Only rows with a valid
 * courseCode/day/start/end make it in — the correction table is responsible for fixing or
 * dropping anything that wouldn't parse cleanly here.
 */
export function mergeRowsIntoCatalog(rows: ParsedRow[]): MergeResult {
  const warnings: string[] = []
  const seen = new Set<string>()
  // key: courseCode||sectionLabel -> accumulated meetings + metadata
  const sectionsByKey = new Map<
    string,
    { courseCode: string; sectionLabel: string; instructor?: string; meetings: Meeting[]; sourceRowIds: string[] }
  >()

  for (const row of rows) {
    const startMin = parseTimeToMinutes(row.startTime)
    const endMin = parseTimeToMinutes(row.endTime)
    if (!row.courseCode || !row.day || startMin === null || endMin === null || endMin <= startMin) {
      continue
    }

    const dedupeKey = `${row.courseCode}||${row.sectionLabel}||${row.day}||${startMin}`
    if (seen.has(dedupeKey)) {
      warnings.push(`duplicate row skipped: ${row.courseCode} Şb.${row.sectionLabel} ${row.day} ${row.startTime}`)
      continue
    }
    seen.add(dedupeKey)

    const sectionKey = `${row.courseCode}||${row.sectionLabel || '1'}`
    const entry = sectionsByKey.get(sectionKey) ?? {
      courseCode: row.courseCode,
      sectionLabel: row.sectionLabel || '1',
      instructor: row.instructor || undefined,
      meetings: [],
      sourceRowIds: [],
    }
    entry.meetings.push({
      day: row.day as Weekday,
      startMin,
      endMin,
      room: row.room || undefined,
    })
    entry.sourceRowIds.push(row.id)
    if (!entry.instructor && row.instructor) entry.instructor = row.instructor
    sectionsByKey.set(sectionKey, entry)
  }

  const courseMap = new Map<string, Section[]>()
  for (const entry of sectionsByKey.values()) {
    const section: Section = {
      id: sectionId(entry.courseCode, entry.sectionLabel, entry.meetings),
      courseCode: entry.courseCode,
      sectionLabel: entry.sectionLabel,
      instructor: entry.instructor,
      meetings: entry.meetings,
      sourceRowIds: entry.sourceRowIds,
    }
    const list = courseMap.get(entry.courseCode) ?? []
    list.push(section)
    courseMap.set(entry.courseCode, list)
  }

  const courses: Course[] = [...courseMap.entries()]
    .map(([code, sections]) => ({
      code,
      sections: sections.sort((a, b) => a.sectionLabel.localeCompare(b.sectionLabel)),
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  return { courses, warnings }
}
