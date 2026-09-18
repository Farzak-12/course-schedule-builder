import { useCatalogStore } from '@/store/catalogStore'
import { ImportPanel } from '@/components/import/ImportPanel'
import { TimetableGrid } from '@/components/grid/TimetableGrid'
import { ClashList } from '@/components/clashes/ClashList'
import { ThemeToggle } from './ThemeToggle'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const confirmed = useCatalogStore((s) => s.confirmed)

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-display text-2xl text-text">Course Schedule Builder</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        <ImportPanel />

        {confirmed && (
          <div className="flex flex-col gap-6 md:flex-row">
            <Sidebar />
            <div className="min-w-0 flex-1 space-y-6">
              <TimetableGrid />
              <ClashList />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
