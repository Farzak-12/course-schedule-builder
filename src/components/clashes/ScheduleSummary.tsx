import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { getEnrolledSections } from '@/lib/schedule'
import { courseColor } from '@/lib/courseColor'
import { minutesToTimeString } from '@/lib/time'

/** Plain-text list of every course currently on the timetable and its chosen section — also
 *  what prints/exports, since it's a clean reference independent of the interactive grid. */
export function ScheduleSummary() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)

  const enrolled = useMemo(() => getEnrolledSections(courses, picks), [courses, picks])

  if (enrolled.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl text-text">Your courses</h2>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface-raised">
        {enrolled.map(({ course, section }) => (
          <li key={section.id} className="flex items-start gap-3 px-4 py-2.5">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: courseColor(course.code) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-sm font-medium text-text">{course.code}</span>
                <span className="font-mono text-xs text-text-muted">Şb.{section.sectionLabel}</span>
                {course.title && <span className="text-xs text-text-muted">{course.title}</span>}
              </div>
              <div className="font-mono text-xs text-text-muted">
                {section.meetings
                  .map(
                    (m) =>
                      `${m.day} ${minutesToTimeString(m.startMin)}–${minutesToTimeString(m.endMin)}${m.room ? ` (${m.room})` : ''}`,
                  )
                  .join(' · ')}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
