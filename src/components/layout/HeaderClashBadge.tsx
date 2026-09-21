import { useMemo } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { picksToAssignment } from '@/lib/optimizer/assignment'
import { computeCost } from '@/lib/optimizer/clashCost'
import { WarningIcon } from '@/components/common/icons'

/** Live total-clash-count pill for the header — reflects the student's current picks. */
export function HeaderClashBadge() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)
  const hasSelection = useSelectionStore((s) => s.selectedCourseCodes.length > 0)

  const distinctPairCount = useMemo(() => {
    const assignment = picksToAssignment(picks)
    return computeCost(assignment, courses).distinctPairCount
  }, [picks, courses])

  if (!hasSelection) return null

  if (distinctPairCount === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-text-muted">
        No clashes
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-clash/40 bg-clash-bg px-3 py-1.5 text-sm font-medium text-clash">
      <WarningIcon className="h-4 w-4" />
      {distinctPairCount} {distinctPairCount === 1 ? 'clash' : 'clashes'}
    </span>
  )
}
