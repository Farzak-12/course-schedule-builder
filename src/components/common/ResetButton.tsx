import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'

/** Snaps the student's current picks back to the computed minimum-clash combination. */
export function ResetButton() {
  const courses = useCatalogStore((s) => s.courses)
  const resetToOptimum = useSelectionStore((s) => s.resetToOptimum)
  const hasSelection = useSelectionStore((s) => s.selectedCourseCodes.length > 0)

  if (!hasSelection) return null

  return (
    <button
      type="button"
      onClick={() => resetToOptimum(courses)}
      className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-strong transition-colors"
    >
      Reset to best combination
    </button>
  )
}
