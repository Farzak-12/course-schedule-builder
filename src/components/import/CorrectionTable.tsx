import { Fragment, useState } from 'react'
import { WEEKDAY_ORDER } from '@/types'
import { useCatalogStore } from '@/store/catalogStore'
import { WarningIcon } from '@/components/common/icons'

const FIELDS: { key: 'courseCode' | 'sectionLabel' | 'room' | 'day' | 'startTime' | 'endTime' | 'instructor'; label: string }[] = [
  { key: 'courseCode', label: 'Course' },
  { key: 'sectionLabel', label: 'Şb.' },
  { key: 'room', label: 'Room' },
  { key: 'day', label: 'Day' },
  { key: 'startTime', label: 'Start' },
  { key: 'endTime', label: 'End' },
  { key: 'instructor', label: 'Instructor' },
]

export function CorrectionTable() {
  const rawRows = useCatalogStore((s) => s.rawRows)
  const updateRawRow = useCatalogStore((s) => s.updateRawRow)
  const deleteRawRow = useCatalogStore((s) => s.deleteRawRow)
  const duplicateRawRow = useCatalogStore((s) => s.duplicateRawRow)
  const confirmCatalog = useCatalogStore((s) => s.confirmCatalog)
  const [inspecting, setInspecting] = useState<string | null>(null)

  if (rawRows.length === 0) return null

  const lowConfidenceCount = rawRows.filter((r) => r.confidence === 'low').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {rawRows.length} rows extracted
          {lowConfidenceCount > 0 && (
            <span className="text-warning"> · {lowConfidenceCount} need a look</span>
          )}
        </p>
        <button
          type="button"
          onClick={confirmCatalog}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-strong transition-colors"
        >
          Confirm &amp; build catalog
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-text-muted">
              {FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-2 font-medium font-mono text-xs">
                  {f.label}
                </th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rawRows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className={`border-t border-border ${row.confidence === 'low' ? 'bg-warning-bg' : ''}`}
                >
                  {FIELDS.map((f) => (
                    <td key={f.key} className="px-2 py-1.5">
                      {f.key === 'day' ? (
                        <select
                          value={row.day}
                          onChange={(e) => updateRawRow(row.id, { day: e.target.value as typeof row.day })}
                          className="w-full rounded border border-border bg-surface-raised px-1.5 py-1 font-mono text-xs text-text"
                        >
                          <option value="">—</option>
                          {WEEKDAY_ORDER.slice(0, 5).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={row[f.key]}
                          onChange={(e) => updateRawRow(row.id, { [f.key]: e.target.value })}
                          className="w-full rounded border border-border bg-surface-raised px-1.5 py-1 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {row.warnings.length > 0 && (
                        <button
                          type="button"
                          title={row.warnings.join('\n')}
                          onClick={() => setInspecting(inspecting === row.id ? null : row.id)}
                          className="text-warning"
                        >
                          <WarningIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => duplicateRawRow(row.id)}
                        className="text-xs text-text-muted hover:text-accent"
                        title="Duplicate row"
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRawRow(row.id)}
                        className="text-xs text-text-muted hover:text-clash"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
                {inspecting === row.id && (
                  <tr className="border-t border-border bg-surface">
                    <td colSpan={FIELDS.length + 1} className="px-3 py-2 font-mono text-xs text-text-muted">
                      <div className="mb-1">Raw extracted cells: {JSON.stringify(row.raw)}</div>
                      <div>Warnings: {row.warnings.join('; ')}</div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
