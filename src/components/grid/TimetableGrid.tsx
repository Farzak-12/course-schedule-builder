import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import type { Weekday } from '@/types'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { computeCost } from '@/lib/optimizer/clashCost'
import { buildGridData } from '@/lib/grid'
import { TimeAxis } from './TimeAxis'
import { DayColumn } from './DayColumn'

const EMPTY_SET = new Set<string>()

export function TimetableGrid() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)

  const assignment = useMemo(() => picksToAssignment(picks), [picks])
  const cost = useMemo(() => computeCost(assignment, courses), [assignment, courses])
  const gridData = useMemo(() => buildGridData(assignment, courses), [assignment, courses])

  // Scoped per day: a section that meets several times a week (e.g. Tue + Mon + Mon) should only
  // show the clash tag on the specific meeting(s) that actually overlap something, not on every
  // occurrence of that section.
  const clashedSectionIdsByDay = useMemo(() => {
    const byDay = new Map<Weekday, Set<string>>()
    for (const pair of cost.pairs) {
      const ids = byDay.get(pair.day) ?? new Set<string>()
      ids.add(pair.aSectionId)
      ids.add(pair.bSectionId)
      byDay.set(pair.day, ids)
    }
    return byDay
  }, [cost.pairs])

  const clashCountByDay = useMemo(() => {
    const counts = new Map<Weekday, number>()
    for (const pair of cost.pairs) {
      counts.set(pair.day, (counts.get(pair.day) ?? 0) + 1)
    }
    return counts
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
        <div className="shrink-0">
          <div className="h-14" aria-hidden />
          <TimeAxis startMin={gridData.startMin} endMin={gridData.endMin} />
        </div>
        {gridData.days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={gridData.byDay.get(day) ?? []}
            clashedSectionIds={clashedSectionIdsByDay.get(day) ?? EMPTY_SET}
            clashCount={clashCountByDay.get(day) ?? 0}
            startMin={gridData.startMin}
            endMin={gridData.endMin}
          />
        ))}
      </div>
    </div>
  )
}
