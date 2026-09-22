import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { ImportPanel } from '@/components/import/ImportPanel'
import { CoursePicker } from '@/components/import/CoursePicker'
import { TimetableGrid } from '@/components/grid/TimetableGrid'
import { ClashList } from '@/components/clashes/ClashList'
import { ScheduleSummary } from '@/components/clashes/ScheduleSummary'
import { ResetButton } from '@/components/common/ResetButton'
import { ThemeToggle } from './ThemeToggle'
import { HeaderClashBadge } from './HeaderClashBadge'
import { ExportMenu } from './ExportMenu'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const hasCourses = useCatalogStore((s) => s.courses.size > 0)
  const hasSelection = useSelectionStore((s) => s.selectedCourseCodes.length > 0)

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-4 py-5 md:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold text-text">Course Schedule Builder</h1>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <ResetButton />
            <ExportMenu />
            <HeaderClashBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        <div className="space-y-6 print:hidden">
          <ImportPanel />
          {hasCourses && !hasSelection && <CoursePicker />}
        </div>

        {hasCourses && hasSelection && (
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="print:hidden">
              <Sidebar />
            </div>
            <div className="min-w-0 flex-1 space-y-6">
              <TimetableGrid />
              <div className="print:hidden">
                <ClashList />
              </div>
              <ScheduleSummary />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
