export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export const WEEKDAY_ORDER: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** One contiguous meeting time for a section. A section can have several (e.g. Mon + Wed). */
export interface Meeting {
  day: Weekday
  startMin: number
  endMin: number
  room?: string
}

export interface Section {
  /** Stable hash of courseCode + sectionLabel + sorted meetings. */
  id: string
  courseCode: string
  /** The raw "Şb." value, e.g. "1", "A". */
  sectionLabel: string
  instructor?: string
  meetings: Meeting[]
  /** Traceability back to the raw parsed rows that produced this section, for the correction UI. */
  sourceRowIds: string[]
}

export interface Course {
  code: string
  title?: string
  sections: Section[]
}

export type CourseMode = 'locked' | 'choice' | 'optional'

export interface CoursePick {
  courseCode: string
  mode: CourseMode
  /** For optional courses: whether the student has turned this course on at all. */
  enabled: boolean
  /** Undefined only when optional+disabled. */
  selectedSectionId?: string
}

/** The sentinel used in Assignment/CandidateSlot for an optional course that's turned off. */
export const OFF = 'OFF' as const

export interface CandidateSlot {
  courseCode: string
  mode: CourseMode
  /** Section ids this slot may take, or the OFF sentinel for optional courses. */
  candidates: string[]
}

/** courseCode -> chosen sectionId | OFF. Locked courses are always present with their single section. */
export type Assignment = Record<string, string>

export interface ClashPair {
  day: Weekday
  aSectionId: string
  bSectionId: string
  aCourseCode: string
  bCourseCode: string
  overlapStartMin: number
  overlapEndMin: number
  overlapMinutes: number
  /** false when one meeting fully contains the other. */
  isPartial: boolean
}

export interface CostResult {
  totalClashMinutes: number
  distinctPairCount: number
  pairs: ClashPair[]
}
