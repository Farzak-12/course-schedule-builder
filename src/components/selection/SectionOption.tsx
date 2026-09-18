import type { Assignment, Course, Section } from '@/types'
import { useWhatIf } from '@/hooks/useWhatIf'
import { Badge } from '@/components/common/Badge'
import { MeetingTimes } from './MeetingTimes'

interface SectionOptionProps {
  course: Course
  section: Section
  selected: boolean
  currentAssignment: Assignment
  courseMap: Map<string, Course>
  onSelect: () => void
}

/** One radio option within a Choice/Optional course row — shows a live what-if badge when not selected. */
export function SectionOption({ course, section, selected, currentAssignment, courseMap, onSelect }: SectionOptionProps) {
  const whatIfClashes = useWhatIf(currentAssignment, course.code, section.id, courseMap)

  return (
    <label className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-surface cursor-pointer">
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name={`section-${course.code}`}
          checked={selected}
          onChange={onSelect}
          className="accent-accent"
        />
        <span className="font-mono text-xs text-text">Şb.{section.sectionLabel}</span>
        <MeetingTimes section={section} />
      </span>
      {!selected && <Badge count={whatIfClashes} />}
    </label>
  )
}
