import { useEffect } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'

/**
 * Reconciles the (persisted) selection state against the catalog whenever a new catalog is
 * confirmed — this is what makes the initial/on-reload render resolve to the optimum instead of
 * "first section of everything." See selectionStore.syncWithCatalog for the reconciliation rules.
 */
export function useOptimizedPicks(): void {
  const confirmed = useCatalogStore((s) => s.confirmed)
  const courses = useCatalogStore((s) => s.courses)
  const syncWithCatalog = useSelectionStore((s) => s.syncWithCatalog)

  useEffect(() => {
    if (confirmed) syncWithCatalog(courses)
    // syncWithCatalog is stable (zustand action); only confirmed/courses should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, courses])
}
