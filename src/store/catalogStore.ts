import { create } from 'zustand'
import type { Course } from '@/types'
import type { ParsedRow } from '@/lib/parser/types'
import { mergeRowsIntoCatalog } from '@/lib/parser/merge'

interface CatalogState {
  /** Catalog built from every parsed row so far, keyed by course code. */
  courses: Map<string, Course>
  /** Every row parsed so far — the catalog is always re-derived from this, so edits (via the
   *  optional correction table) can be re-synced with confirmCatalog(). */
  rawRows: ParsedRow[]
  importWarnings: string[]
  /** True once at least one successful parse has produced a catalog. */
  confirmed: boolean

  /** Adds newly parsed rows and immediately re-merges them into the catalog — no manual
   *  "confirm" step; the course picker can appear right away. */
  addImportBatch: (rows: ParsedRow[]) => void
  setRawRows: (rows: ParsedRow[]) => void
  updateRawRow: (id: string, patch: Partial<ParsedRow>) => void
  deleteRawRow: (id: string) => void
  duplicateRawRow: (id: string) => void
  /** Re-derives the catalog from the current rawRows — used for the initial auto-merge and to
   *  re-sync after manual corrections. */
  confirmCatalog: () => void
  clearImport: () => void
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  courses: new Map(),
  rawRows: [],
  importWarnings: [],
  confirmed: false,

  addImportBatch: (rows) => {
    set((state) => ({ rawRows: [...state.rawRows, ...rows] }))
    get().confirmCatalog()
  },

  setRawRows: (rows) => set({ rawRows: rows }),

  updateRawRow: (id, patch) =>
    set((state) => ({
      rawRows: state.rawRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })),

  deleteRawRow: (id) => set((state) => ({ rawRows: state.rawRows.filter((row) => row.id !== id) })),

  duplicateRawRow: (id) =>
    set((state) => {
      const index = state.rawRows.findIndex((row) => row.id === id)
      if (index === -1) return state
      const original = state.rawRows[index]!
      const copy: ParsedRow = { ...original, id: `${original.id}_copy_${Date.now()}` }
      const rawRows = [...state.rawRows]
      rawRows.splice(index + 1, 0, copy)
      return { rawRows }
    }),

  confirmCatalog: () => {
    const { rawRows } = get()
    const { courses, warnings } = mergeRowsIntoCatalog(rawRows)
    const courseMap = new Map(courses.map((c) => [c.code, c]))
    set({ courses: courseMap, importWarnings: warnings, confirmed: true })
  },

  clearImport: () => set({ courses: new Map(), rawRows: [], importWarnings: [], confirmed: false }),
}))
