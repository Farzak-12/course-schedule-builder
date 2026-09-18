import { useState } from 'react'
import { parseCsvText } from '@/lib/parser/csvParser'
import { useCatalogStore } from '@/store/catalogStore'

export function PasteTextArea() {
  const addImportBatch = useCatalogStore((s) => s.addImportBatch)
  const [text, setText] = useState('')

  function handleParse() {
    if (!text.trim()) return
    const rows = parseCsvText(text)
    addImportBatch(rows)
    setText('')
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Paste a table: course code, section, room, day, start, end\ne.g.  BA205\t1\tA204\tPazartesi\t09:00\t10:50'}
        rows={6}
        className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="button"
        onClick={handleParse}
        disabled={!text.trim()}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-strong transition-colors disabled:opacity-50"
      >
        Parse pasted text
      </button>
    </div>
  )
}
