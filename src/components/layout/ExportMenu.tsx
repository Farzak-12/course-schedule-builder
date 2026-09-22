import { useState } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'
import { getEnrolledSections } from '@/lib/schedule'
import { buildIcsCalendar } from '@/lib/exportIcs'
import { downloadTextFile } from '@/lib/download'

/** Export the current timetable — as a printable PDF (via the browser's print dialog) or as an
 *  .ics file importable into Google Calendar, Apple Calendar, Outlook, etc. */
export function ExportMenu() {
  const courses = useCatalogStore((s) => s.courses)
  const picks = useSelectionStore((s) => s.picks)
  const hasSelection = useSelectionStore((s) => s.selectedCourseCodes.length > 0)
  const [open, setOpen] = useState(false)

  if (!hasSelection) return null

  function handlePrint() {
    setOpen(false)
    window.print()
  }

  function handleIcs() {
    setOpen(false)
    const enrolled = getEnrolledSections(courses, picks)
    const ics = buildIcsCalendar(enrolled)
    downloadTextFile('timetable.ics', ics, 'text/calendar;charset=utf-8')
  }

  return (
    <div
      className="relative print:hidden"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text hover:bg-surface transition-colors"
      >
        Export
      </button>
      {open && (
        <ul className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
          <li>
            <button
              type="button"
              onClick={handlePrint}
              className="block w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface"
            >
              Export as PDF
              <span className="block text-xs text-text-muted">Opens the print dialog — save as PDF</span>
            </button>
          </li>
          <li className="border-t border-border">
            <button
              type="button"
              onClick={handleIcs}
              className="block w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface"
            >
              Add to calendar (.ics)
              <span className="block text-xs text-text-muted">Imports into Google, Apple, or Outlook Calendar</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
