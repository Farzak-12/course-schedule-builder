import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { computeCost } from '@/lib/optimizer/clashCost'
import { minutesToTimeString } from '@/lib/time'
import { courseColor } from '@/lib/courseColor'
import { WarningIcon } from '@/components/common/icons'

export function ClashList() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)

  const assignment = useMemo(() => picksToAssignment(picks), [picks])
  const cost = useMemo(() => computeCost(assignment, courses), [assignment, courses])

  if (Object.keys(assignment).length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl text-text">Clashes</h2>
      {cost.pairs.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text-muted">
          No clashes in your current schedule.
        </p>
      ) : (
        <ul className="space-y-2">
          {cost.pairs.map((pair, i) => (
            <li
              key={`${pair.aSectionId}-${pair.bSectionId}-${i}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-clash/30 bg-clash-bg px-4 py-2.5 text-sm"
              style={{ borderLeft: `3px solid var(--color-clash)` }}
            >
              <span className="flex items-center gap-1 font-mono font-medium text-clash">
                <WarningIcon className="h-3.5 w-3.5" />
                {pair.day}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-text">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: courseColor(pair.aCourseCode) }}
                />
                {pair.aCourseCode}
                <span className="text-text-muted">↔</span>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: courseColor(pair.bCourseCode) }}
                />
                {pair.bCourseCode}
              </span>
              <span className="font-mono text-xs text-text-muted">
                {minutesToTimeString(pair.overlapStartMin)}–{minutesToTimeString(pair.overlapEndMin)} (
                {pair.overlapMinutes} min, {pair.isPartial ? 'partial' : 'full'} overlap)
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
