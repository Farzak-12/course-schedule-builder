import { create } from 'zustand'
import type { Course } from '@/types'
import type { ParsedRow } from '@/lib/parser/types'
import { mergeRowsIntoCatalog } from '@/lib/parser/merge'

interface CatalogState {
  /** Confirmed catalog, keyed by course code. Empty until the student confirms an import. */
  courses: Map<string, Course>
  /** Working set of rows awaiting review/correction, not yet part of the catalog. */
  rawRows: ParsedRow[]
  importWarnings: string[]
  confirmed: boolean

  addImportBatch: (rows: ParsedRow[]) => void
  setRawRows: (rows: ParsedRow[]) => void
  updateRawRow: (id: string, patch: Partial<ParsedRow>) => void
  deleteRawRow: (id: string) => void
  duplicateRawRow: (id: string) => void
  confirmCatalog: () => void
  clearImport: () => void
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  courses: new Map(),
  rawRows: [],
  importWarnings: [],
  confirmed: false,

  addImportBatch: (rows) => set((state) => ({ rawRows: [...state.rawRows, ...rows] })),

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
