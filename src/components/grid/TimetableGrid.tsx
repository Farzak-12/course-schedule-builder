import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { computeCost } from '@/lib/optimizer/clashCost'
import { buildGridData } from '@/lib/grid'
import { TimeAxis } from './TimeAxis'
import { DayColumn } from './DayColumn'

export function TimetableGrid() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)

  const assignment = useMemo(() => picksToAssignment(picks), [picks])
  const cost = useMemo(() => computeCost(assignment, courses), [assignment, courses])
  const gridData = useMemo(() => buildGridData(assignment, courses), [assignment, courses])

  const clashedSectionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const pair of cost.pairs) {
      ids.add(pair.aSectionId)
      ids.add(pair.bSectionId)
    }
    return ids
  }, [cost.pairs])

  if (Object.keys(assignment).length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
        Your timetable will appear here once you add some courses.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
      <div className="flex min-w-[640px]">
        <div className="pt-9">
          <TimeAxis startMin={gridData.startMin} endMin={gridData.endMin} />
        </div>
        {gridData.days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={gridData.byDay.get(day) ?? []}
            clashedSectionIds={clashedSectionIds}
            startMin={gridData.startMin}
            endMin={gridData.endMin}
          />
        ))}
      </div>
    </div>
  )
}
