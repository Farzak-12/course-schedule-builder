import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { deriveCourseMode } from '@/lib/courseMode'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { LockedRow } from './LockedRow'
import { ChoiceRow } from './ChoiceRow'
import { OptionalRow } from './OptionalRow'

export function ControlList() {
  const courses = useCatalogStore((s) => s.courses)
  const selectedCourseCodes = useSelectionStore((s) => s.selectedCourseCodes)
  const picks = useSelectionStore((s) => s.picks)
  const modeOverrides = useSelectionStore((s) => s.modeOverrides)

  const currentAssignment = useMemo(() => picksToAssignment(picks), [picks])

  if (selectedCourseCodes.length === 0) {
    return <p className="text-sm text-text-muted">Search above to add the courses you're taking.</p>
  }

  return (
    <ul className="space-y-2">
      {selectedCourseCodes.map((code) => {
        const course = courses.get(code)
        if (!course) return null
        const mode = deriveCourseMode(course, modeOverrides)
        const pick = picks[code]

        return (
          <li key={code}>
            {mode === 'locked' && <LockedRow course={course} />}
            {mode === 'choice' && pick && (
              <ChoiceRow course={course} pick={pick} currentAssignment={currentAssignment} courseMap={courses} />
            )}
            {mode === 'optional' && pick && (
              <OptionalRow course={course} pick={pick} currentAssignment={currentAssignment} courseMap={courses} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
