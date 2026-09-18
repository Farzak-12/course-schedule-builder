import { useState } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { PdfDropzone } from './PdfDropzone'
import { PasteTextArea } from './PasteTextArea'
import { CorrectionTable } from './CorrectionTable'

type Tab = 'pdf' | 'paste'

export function ImportPanel() {
  const [tab, setTab] = useState<Tab>('pdf')
  const confirmed = useCatalogStore((s) => s.confirmed)
  const clearImport = useCatalogStore((s) => s.clearImport)

  if (confirmed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <span className="text-sm text-text-muted">Catalog imported for this session.</span>
        <button
          type="button"
          onClick={clearImport}
          className="text-sm font-medium text-accent hover:text-accent-strong"
        >
          Import a different schedule
        </button>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl text-text">Import your schedule</h2>

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

      <CorrectionTable />
    </section>
  )
}
