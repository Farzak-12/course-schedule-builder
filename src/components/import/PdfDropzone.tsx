import { useState } from 'react'
import { parsePdfFile } from '@/lib/parser/pdfParser'
import { useCatalogStore } from '@/store/catalogStore'

export function PdfDropzone() {
  const addImportBatch = useCatalogStore((s) => s.addImportBatch)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const rows = await parsePdfFile(file)
        addImportBatch(rows)
      }
    } catch {
      setError('Could not read that PDF — try pasting the table text instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <label
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-8 text-center cursor-pointer hover:border-accent transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void handleFiles(e.dataTransfer.files)
        }}
      >
        <span className="font-display text-lg text-text">Drop schedule PDFs here</span>
        <span className="text-sm text-text-muted">or click to browse — you can add more than one</span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>
      {busy && <p className="text-sm text-text-muted">Reading PDF…</p>}
      {error && <p className="text-sm text-clash">{error}</p>}
    </div>
  )
}
