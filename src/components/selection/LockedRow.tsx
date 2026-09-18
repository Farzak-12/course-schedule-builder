import type { Course } from '@/types'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { LockIcon } from '@/components/common/icons'
import { MeetingTimes } from './MeetingTimes'

export function LockedRow({ course }: { course: Course }) {
  const courses = useCatalogStore((s) => s.courses)
  const removeCourse = useSelectionStore((s) => s.removeCourse)
  const section = course.sections[0]
  if (!section) return null

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex items-start gap-2">
        <LockIcon className="mt-0.5 h-4 w-4 text-text-muted" />
        <div>
          <div className="font-mono text-sm text-text">{course.code}</div>
          <MeetingTimes section={section} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeCourse(course.code, courses)}
        className="text-xs text-text-muted hover:text-clash"
        title="Remove course"
      >
        ✕
      </button>
    </div>
  )
}
