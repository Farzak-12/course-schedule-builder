import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { deriveCourseMode } from '@/lib/courseMode'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { SidebarCard } from '@/components/common/SidebarCard'
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

  const lockedCodes: string[] = []
  const flexibleCodes: string[] = []
  for (const code of selectedCourseCodes) {
    const course = courses.get(code)
    if (!course) continue
    const mode = deriveCourseMode(course, modeOverrides)
    if (mode === 'locked') lockedCodes.push(code)
    else flexibleCodes.push(code)
  }

  return (
    <div className="space-y-4">
      {lockedCodes.length > 0 && (
        <SidebarCard title="Fixed courses" description="Single section on the schedule — always on.">
          {lockedCodes.map((code) => {
            const course = courses.get(code)
            if (!course) return null
            return <LockedRow key={code} course={course} />
          })}
        </SidebarCard>
      )}

      {flexibleCodes.length > 0 && (
        <SidebarCard title="Pick your sections" description="Multiple sections exist — choose one per course, or drop it entirely.">
          {flexibleCodes.map((code) => {
            const course = courses.get(code)
            const pick = picks[code]
            if (!course || !pick) return null
            const mode = deriveCourseMode(course, modeOverrides)
            return mode === 'optional' ? (
              <OptionalRow key={code} course={course} pick={pick} currentAssignment={currentAssignment} courseMap={courses} />
            ) : (
              <ChoiceRow key={code} course={course} pick={pick} currentAssignment={currentAssignment} courseMap={courses} />
            )
          })}
        </SidebarCard>
      )}
    </div>
  )
}
