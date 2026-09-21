import type { Course } from '@/types'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { LockIcon } from '@/components/common/icons'
import { courseColor } from '@/lib/courseColor'
import { MeetingTimes } from './MeetingTimes'

export function LockedRow({ course }: { course: Course }) {
  const courses = useCatalogStore((s) => s.courses)
  const removeCourse = useSelectionStore((s) => s.removeCourse)
  const setCourseMode = useSelectionStore((s) => s.setCourseMode)
  const section = course.sections[0]
  if (!section) return null

  return (
    <div className="flex items-start gap-3 px-4 py-2.5" style={{ borderLeft: `3px solid ${courseColor(course.code)}` }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium text-text">{course.code}</span>
          <LockIcon className="h-3.5 w-3.5 text-text-muted" />
        </div>
        <MeetingTimes section={section} />
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => setCourseMode(course.code, 'optional', courses)}
          className="text-xs text-text-muted hover:text-accent"
          title="Mark as elective/droppable"
        >
          mark elective
        </button>
        <button
          type="button"
          onClick={() => removeCourse(course.code, courses)}
          className="text-xs text-text-muted hover:text-clash"
          title="Remove course"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
