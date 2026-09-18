import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Assignment, Course, CoursePick, CourseMode } from '@/types'
import { OFF } from '@/types'
import { deriveCourseMode } from '@/lib/courseMode'
import { buildCandidateSlots } from '@/lib/optimizer/candidateSlots'
import { findOptimalAssignment } from '@/lib/optimizer/bruteForce'
import { safeLocalStorage } from '@/lib/storage'

interface SelectionState {
  selectedCourseCodes: string[]
  /** Only the user-set 'optional' designation is stored; locked/choice are derived from the catalog. */
  modeOverrides: Record<string, CourseMode>
  picks: Record<string, CoursePick>
  optimizedBaseline: Assignment | null

  addCourse: (code: string, courseMap: Map<string, Course>) => void
  removeCourse: (code: string, courseMap: Map<string, Course>) => void
  setCourseMode: (code: string, mode: 'choice' | 'optional', courseMap: Map<string, Course>) => void
  setSectionPick: (code: string, sectionId: string) => void
  setOptionalEnabled: (code: string, enabled: boolean, courseMap: Map<string, Course>) => void
  resetToOptimum: (courseMap: Map<string, Course>) => void
  recomputeAndApply: (courseMap: Map<string, Course>) => void
  /** Reconciles persisted picks against a freshly confirmed catalog: drops unknown courses,
   *  keeps valid persisted picks as-is, and fills gaps (missing/stale section ids) from a
   *  freshly computed optimum. Called once per catalog confirm/rehydration. */
  syncWithCatalog: (courseMap: Map<string, Course>) => void
}

function applyAssignmentToPicks(
  assignment: Assignment,
  courseMap: Map<string, Course>,
  selectedCourseCodes: string[],
  modeOverrides: Record<string, CourseMode>,
): Record<string, CoursePick> {
  const picks: Record<string, CoursePick> = {}
  for (const code of selectedCourseCodes) {
    const course = courseMap.get(code)
    if (!course) continue
    const mode = deriveCourseMode(course, modeOverrides)
    const value = assignment[code]
    picks[code] = {
      courseCode: code,
      mode,
      enabled: value !== undefined && value !== OFF,
      selectedSectionId: value && value !== OFF ? value : undefined,
    }
  }
  return picks
}

function computeBaseline(
  selectedCourseCodes: string[],
  courseMap: Map<string, Course>,
  modeOverrides: Record<string, CourseMode>,
): Assignment {
  const { baseAssignment, slots } = buildCandidateSlots(selectedCourseCodes, courseMap, modeOverrides)
  const { assignment } = findOptimalAssignment(baseAssignment, slots, courseMap)
  return assignment
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      selectedCourseCodes: [],
      modeOverrides: {},
      picks: {},
      optimizedBaseline: null,

      addCourse: (code, courseMap) => {
        if (get().selectedCourseCodes.includes(code)) return
        set((state) => ({ selectedCourseCodes: [...state.selectedCourseCodes, code] }))
        get().recomputeAndApply(courseMap)
      },

      removeCourse: (code, courseMap) => {
        set((state) => {
          const { [code]: _removedOverride, ...modeOverrides } = state.modeOverrides
          const { [code]: _removedPick, ...picks } = state.picks
          return {
            selectedCourseCodes: state.selectedCourseCodes.filter((c) => c !== code),
            modeOverrides,
            picks,
          }
        })
        if (get().selectedCourseCodes.length > 0) {
          get().recomputeAndApply(courseMap)
        } else {
          set({ optimizedBaseline: null })
        }
      },

      setCourseMode: (code, mode, courseMap) => {
        set((state) => {
          const modeOverrides = { ...state.modeOverrides }
          if (mode === 'optional') modeOverrides[code] = 'optional'
          else delete modeOverrides[code]
          return { modeOverrides }
        })
        get().recomputeAndApply(courseMap)
      },

      setSectionPick: (code, sectionId) => {
        set((state) => ({
          picks: {
            ...state.picks,
            [code]: { ...state.picks[code], courseCode: code, mode: state.picks[code]?.mode ?? 'choice', enabled: true, selectedSectionId: sectionId },
          },
        }))
      },

      setOptionalEnabled: (code, enabled, courseMap) => {
        set((state) => {
          const course = courseMap.get(code)
          const existing = state.picks[code]
          const fallbackSectionId = course?.sections[0]?.id
          return {
            picks: {
              ...state.picks,
              [code]: {
                courseCode: code,
                mode: 'optional',
                enabled,
                selectedSectionId: enabled ? (existing?.selectedSectionId ?? fallbackSectionId) : undefined,
              },
            },
          }
        })
      },

      recomputeAndApply: (courseMap) => {
        const { selectedCourseCodes, modeOverrides } = get()
        const assignment = computeBaseline(selectedCourseCodes, courseMap, modeOverrides)
        set({
          optimizedBaseline: assignment,
          picks: applyAssignmentToPicks(assignment, courseMap, selectedCourseCodes, modeOverrides),
        })
      },

      resetToOptimum: (courseMap) => {
        const { optimizedBaseline, selectedCourseCodes, modeOverrides } = get()
        if (!optimizedBaseline) {
          get().recomputeAndApply(courseMap)
          return
        }
        set({
          picks: applyAssignmentToPicks(optimizedBaseline, courseMap, selectedCourseCodes, modeOverrides),
        })
      },

      syncWithCatalog: (courseMap) => {
        const { selectedCourseCodes, modeOverrides, picks } = get()
        const validCodes = selectedCourseCodes.filter((code) => courseMap.has(code))

        if (validCodes.length === 0) {
          set({ selectedCourseCodes: [], picks: {}, optimizedBaseline: null })
          return
        }

        const baseline = computeBaseline(validCodes, courseMap, modeOverrides)
        const baselinePicks = applyAssignmentToPicks(baseline, courseMap, validCodes, modeOverrides)

        const reconciledPicks: Record<string, CoursePick> = {}
        for (const code of validCodes) {
          const course = courseMap.get(code)!
          const mode = deriveCourseMode(course, modeOverrides)
          const existing = picks[code]
          const existingSectionValid =
            existing?.selectedSectionId && course.sections.some((s) => s.id === existing.selectedSectionId)

          if (mode === 'locked') {
            reconciledPicks[code] = baselinePicks[code]!
          } else if (existing && (existingSectionValid || (mode === 'optional' && existing.enabled === false))) {
            reconciledPicks[code] = { ...existing, mode }
          } else {
            reconciledPicks[code] = baselinePicks[code]!
          }
        }

        set({
          selectedCourseCodes: validCodes,
          optimizedBaseline: baseline,
          picks: reconciledPicks,
        })
      },
    }),
    {
      name: 'csb:selection:v1',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        selectedCourseCodes: state.selectedCourseCodes,
        modeOverrides: state.modeOverrides,
        picks: state.picks,
      }),
    },
  ),
)
