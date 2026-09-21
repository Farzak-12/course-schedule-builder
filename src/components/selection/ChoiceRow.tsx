import type { Assignment, Course, CoursePick } from '@/types'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { courseColor } from '@/lib/courseColor'
import { SectionOption } from './SectionOption'

interface ChoiceRowProps {
  course: Course
  pick: CoursePick
  currentAssignment: Assignment
  courseMap: Map<string, Course>
}

export function ChoiceRow({ course, pick, currentAssignment, courseMap }: ChoiceRowProps) {
  const courses = useCatalogStore((s) => s.courses)
  const removeCourse = useSelectionStore((s) => s.removeCourse)
  const setSectionPick = useSelectionStore((s) => s.setSectionPick)
  const setCourseMode = useSelectionStore((s) => s.setCourseMode)

  return (
    <div className="px-4 py-2.5" style={{ borderLeft: `3px solid ${courseColor(course.code)}` }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium text-text">{course.code}</span>
        <div className="flex items-center gap-2">
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
      <div className="mt-1.5 space-y-1">
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
    </div>
  )
}
