import type { Weekday } from '@/types'

/** A single positioned text fragment, matching the shape of a pdfjs-dist getTextContent() item. */
export interface RawTextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
  pageIndex: number
}

export type ParsedField = 'courseCode' | 'title' | 'sectionLabel' | 'room' | 'day' | 'startTime' | 'endTime'

export interface ParsedRow {
  id: string
  /** Raw extracted cell text keyed by column name, for debugging/inspection. */
  raw: Record<string, string>
  courseCode: string
  /** The course's display name/title, e.g. "Dersin Adı" — blank when the source has no title column. */
  title: string
  sectionLabel: string
  room: string
  day: Weekday | ''
  /** "HH:MM" as extracted, pre-validation-derived-minutes. */
  startTime: string
  endTime: string
  instructor: string
  confidence: 'high' | 'low'
  warnings: string[]
  sourceFile: string
  sourcePage: number
}
