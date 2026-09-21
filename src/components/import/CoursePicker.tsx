import { useMemo, useState } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'

/**
 * Shown right after a catalog is confirmed: every distinct course code (and title, when the
 * source had one) extracted from the import, so the student picks which ones to build a
 * timetable from instead of hunting for them one at a time in the search box.
 */
export function CoursePicker() {
  const courses = useCatalogStore((s) => s.courses)
  const addCourses = useSelectionStore((s) => s.addCourses)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const sortedCourses = useMemo(() => [...courses.values()].sort((a, b) => a.code.localeCompare(b.code)), [courses])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedCourses
    return sortedCourses.filter((c) => c.code.toLowerCase().includes(q) || (c.title ?? '').toLowerCase().includes(q))
  }, [sortedCourses, query])

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected((prev) => new Set([...prev, ...filtered.map((c) => c.code)]))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function handleAdd() {
    if (selected.size === 0) return
    addCourses([...selected], courses)
  }

  if (courses.size === 0) return null

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface-raised p-4">
      <div>
        <h2 className="font-display text-xl text-text">Which courses are you taking?</h2>
        <p className="text-sm text-text-muted">
          {courses.size} course{courses.size === 1 ? '' : 's'} were extracted from your schedule. Pick the ones to
          build your timetable from — you can add more later.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by code or title…"
        className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{selected.size} selected</span>
        <span className="flex gap-3">
          <button type="button" onClick={selectAllFiltered} className="font-medium text-accent hover:text-accent-strong">
            Select all{query ? ' (filtered)' : ''}
          </button>
          <button type="button" onClick={clearSelection} className="font-medium hover:text-text">
            Clear
          </button>
        </span>
      </div>

      <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {filtered.map((course) => (
          <li key={course.code}>
            <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-surface">
              <span className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={selected.has(course.code)}
                  onChange={() => toggle(course.code)}
                  className="accent-accent shrink-0"
                />
                <span className="font-mono text-sm text-text shrink-0">{course.code}</span>
                {course.title && <span className="truncate text-sm text-text-muted">{course.title}</span>}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {course.sections.length} section{course.sections.length === 1 ? '' : 's'}
              </span>
            </label>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-text-muted">No courses match “{query}”.</li>
        )}
      </ul>

      <button
        type="button"
        onClick={handleAdd}
        disabled={selected.size === 0}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong transition-colors disabled:opacity-50"
      >
        Add {selected.size > 0 ? selected.size : ''} course{selected.size === 1 ? '' : 's'} to my timetable
      </button>
    </section>
  )
}
