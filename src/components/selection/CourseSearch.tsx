import { useMemo, useState } from 'react'
import { useCatalogStore } from '@/store/catalogStore'
import { useSelectionStore } from '@/store/selectionStore'

export function CourseSearch() {
  const courses = useCatalogStore((s) => s.courses)
  const selectedCourseCodes = useSelectionStore((s) => s.selectedCourseCodes)
  const addCourse = useSelectionStore((s) => s.addCourse)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...courses.values()]
      .filter((c) => !selectedCourseCodes.includes(c.code))
      .filter((c) => !q || c.code.toLowerCase().includes(q) || (c.title ?? '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [courses, selectedCourseCodes, query])

  if (courses.size === 0) return null

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Search course code…"
        className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
          {results.map((course) => (
            <li key={course.code}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  addCourse(course.code, courses)
                  setQuery('')
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface"
              >
                <span className="font-mono text-text">{course.code}</span>
                <span className="text-xs text-text-muted">
                  {course.sections.length} section{course.sections.length === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
