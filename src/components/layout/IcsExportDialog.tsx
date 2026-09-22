import { useEffect, useState } from 'react'

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

export interface IcsExportOptionsInput {
  termStart: Date
  termEnd: Date
  calendarName: string
}

interface IcsExportDialogProps {
  onCancel: () => void
  onConfirm: (options: IcsExportOptionsInput) => void
}

/** Collects the term date range (and a calendar name) before generating the .ics export — the
 *  recurrence needs a real start/end so it doesn't repeat on the student's calendar forever. */
export function IcsExportDialog({ onCancel, onConfirm }: IcsExportDialogProps) {
  const [startValue, setStartValue] = useState(() => toDateInputValue(new Date()))
  const [endValue, setEndValue] = useState(() => toDateInputValue(addWeeks(new Date(), 15)))
  const [calendarName, setCalendarName] = useState('My Course Schedule')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const startDate = parseDateInputValue(startValue)
  const endDate = parseDateInputValue(endValue)
  const isValid = Boolean(startDate && endDate && endDate.getTime() >= startDate.getTime())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate || !isValid) return
    onConfirm({ termStart: startDate, termEnd: endDate, calendarName: calendarName.trim() || 'My Course Schedule' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ics-dialog-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ics-dialog-title" className="font-display text-lg text-text">
          Add to calendar
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Classes repeat weekly between these dates. Matching your term's real start and end keeps events from
          piling up on your calendar after the semester is over.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="ics-start">
              Term start date
            </label>
            <input
              id="ics-start"
              type="date"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="ics-end">
              Term end date
            </label>
            <input
              id="ics-end"
              type="date"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="ics-name">
              Calendar name
            </label>
            <input
              id="ics-name"
              type="text"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="My Course Schedule"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {!isValid && <p className="text-xs text-clash">Term end date must be on or after the start date.</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-50"
            >
              Download .ics
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
