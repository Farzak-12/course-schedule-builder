import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { computeCost } from '@/lib/optimizer/clashCost'
import { minutesToTimeString } from '@/lib/time'

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
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted">
          No clashes in your current schedule.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {cost.pairs.map((pair, i) => (
            <li
              key={`${pair.aSectionId}-${pair.bSectionId}-${i}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-clash/40 bg-clash-bg px-3 py-2 text-sm"
            >
              <span className="font-mono font-medium text-clash">{pair.day}</span>
              <span className="font-mono text-text">
                {pair.aCourseCode} ↔ {pair.bCourseCode}
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
