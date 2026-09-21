import type { Assignment, Course, CoursePick } from '@/types'
import { OFF } from '@/types'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { courseColor } from '@/lib/courseColor'
import { SectionOption } from './SectionOption'
import { OptionalToggleBadge } from './OptionalToggleBadge'
import { MeetingTimes } from './MeetingTimes'

interface OptionalRowProps {
  course: Course
  pick: CoursePick
  currentAssignment: Assignment
  courseMap: Map<string, Course>
}

export function OptionalRow({ course, pick, currentAssignment, courseMap }: OptionalRowProps) {
  const courses = useCatalogStore((s) => s.courses)
  const removeCourse = useSelectionStore((s) => s.removeCourse)
  const setOptionalEnabled = useSelectionStore((s) => s.setOptionalEnabled)
  const setSectionPick = useSelectionStore((s) => s.setSectionPick)
  const setCourseMode = useSelectionStore((s) => s.setCourseMode)

  const toggleCandidate = pick.enabled ? OFF : (pick.selectedSectionId ?? course.sections[0]?.id ?? OFF)
  const singleSection = course.sections.length === 1 ? course.sections[0] : undefined

  return (
    <div
      className="px-4 py-2.5"
      style={{ borderLeft: `3px dashed ${courseColor(course.code)}` }}
    >
      <div className="flex items-start gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pick.enabled}
            onChange={(e) => setOptionalEnabled(course.code, e.target.checked, courses)}
            className="shrink-0"
            style={{ accentColor: courseColor(course.code) }}
          />
          <span className="font-mono text-sm font-medium text-text">{course.code}</span>
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <OptionalToggleBadge
            course={course}
            currentAssignment={currentAssignment}
            courseMap={courseMap}
            candidate={toggleCandidate}
          />
          <button
            type="button"
            onClick={() => setCourseMode(course.code, 'choice', courses)}
            className="text-xs text-text-muted hover:text-accent"
            title="Mark as mandatory"
          >
            mark mandatory
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

      {singleSection && pick.enabled && (
        <div className="mt-1 pl-6">
          <MeetingTimes section={singleSection} />
        </div>
      )}

      {pick.enabled && course.sections.length > 1 && (
        <div className="mt-1.5 space-y-1 pl-6">
          {course.sections.map((section) => (
            <SectionOption
              key={section.id}
              course={course}
              section={section}
              selected={pick.selectedSectionId === section.id}
              currentAssignment={currentAssignment}
              courseMap={courseMap}
              onSelect={() => setSectionPick(course.code, section.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
