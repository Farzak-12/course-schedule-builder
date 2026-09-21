import { useState } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { PdfDropzone } from './PdfDropzone'
import { PasteTextArea } from './PasteTextArea'
import { CorrectionTable } from './CorrectionTable'

type Tab = 'pdf' | 'paste'

export function ImportPanel() {
  const [tab, setTab] = useState<Tab>('pdf')
  const [showUploader, setShowUploader] = useState(false)
  const [showCorrections, setShowCorrections] = useState(false)
  const courses = useCatalogStore((s) => s.courses)
  const rawRows = useCatalogStore((s) => s.rawRows)
  const clearImport = useCatalogStore((s) => s.clearImport)

  const hasCourses = courses.size > 0
  const lowConfidenceCount = rawRows.filter((r) => r.confidence === 'low').length
  const parsedButEmpty = rawRows.length > 0 && !hasCourses

  const uploader = (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5 text-sm w-fit">
        <button
          type="button"
          onClick={() => setTab('pdf')}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${tab === 'pdf' ? 'bg-accent text-accent-contrast' : 'text-text-muted'}`}
        >
          PDF upload
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${tab === 'paste' ? 'bg-accent text-accent-contrast' : 'text-text-muted'}`}
        >
          Paste table
        </button>
      </div>
      {tab === 'pdf' ? <PdfDropzone /> : <PasteTextArea />}
    </div>
  )

  if (!hasCourses && !parsedButEmpty) {
    return (
      <section className="space-y-4">
        <h2 className="font-display text-xl text-text">Import your schedule</h2>
        {uploader}
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <span className="text-sm text-text-muted">
          {parsedButEmpty ? (
            <>Couldn't extract any valid courses from that import.</>
          ) : (
            <>
              {courses.size} course{courses.size === 1 ? '' : 's'} extracted from your schedule.
            </>
          )}
          {lowConfidenceCount > 0 && <span className="text-warning"> · {lowConfidenceCount} row(s) need a look</span>}
        </span>
        <span className="flex gap-3 text-sm font-medium">
          <button type="button" onClick={() => setShowUploader((v) => !v)} className="text-accent hover:text-accent-strong">
            {showUploader ? 'Hide uploader' : 'Add another file'}
          </button>
          <button type="button" onClick={() => setShowCorrections((v) => !v)} className="text-accent hover:text-accent-strong">
            {showCorrections ? 'Hide row editor' : 'Fix extraction errors'}
          </button>
          <button type="button" onClick={clearImport} className="text-text-muted hover:text-clash">
            Start over
          </button>
        </span>
      </div>

      {showUploader && uploader}
      {(showCorrections || parsedButEmpty) && <CorrectionTable />}
    </section>
  )
}
