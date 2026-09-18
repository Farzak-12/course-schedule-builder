import { describe, expect, it } from 'vitest'
import { layoutDayColumns } from './columnLayout'

describe('layoutDayColumns', () => {
  it('gives two overlapping blocks two columns at half width', () => {
    const result = layoutDayColumns([
      { id: 'a', startMin: 540, endMin: 630 },
      { id: 'b', startMin: 570, endMin: 660 },
    ])
    expect(result).toHaveLength(2)
    for (const p of result) {
      expect(p.columnCount).toBe(2)
      expect(p.widthPercent).toBe(50)
    }
    const a = result.find((p) => p.block.id === 'a')!
    const b = result.find((p) => p.block.id === 'b')!
    expect(a.columnIndex).not.toBe(b.columnIndex)
  })

  it('gives two disjoint blocks a full-width column each', () => {
    const result = layoutDayColumns([
      { id: 'a', startMin: 540, endMin: 600 },
      { id: 'b', startMin: 660, endMin: 720 },
    ])
    for (const p of result) {
      expect(p.columnCount).toBe(1)
      expect(p.widthPercent).toBe(100)
      expect(p.leftPercent).toBe(0)
    }
  })

  it('gives three mutually overlapping blocks three columns', () => {
    const result = layoutDayColumns([
      { id: 'a', startMin: 540, endMin: 660 },
      { id: 'b', startMin: 540, endMin: 660 },
      { id: 'c', startMin: 540, endMin: 660 },
    ])
    const columnCounts = new Set(result.map((p) => p.columnCount))
    expect(columnCounts).toEqual(new Set([3]))
    const indices = new Set(result.map((p) => p.columnIndex))
    expect(indices).toEqual(new Set([0, 1, 2]))
  })

  it('resolves an overlap chain (A-B overlap, B-C overlap, A-C disjoint) by cluster peak concurrency', () => {
    // A: 09:00-10:00, B: 09:30-10:30, C: 10:15-11:15 — A/C never overlap, but all three
    // are one cluster and the peak concurrency at 09:30-10:00 is 2 (A+B), then 10:15-10:30 is 2 (B+C).
    const result = layoutDayColumns([
      { id: 'a', startMin: 540, endMin: 600 },
      { id: 'b', startMin: 570, endMin: 630 },
      { id: 'c', startMin: 615, endMin: 675 },
    ])
    // All three belong to one maximal cluster (transitively connected), so they share one
    // columnCount, and it must be at least the true peak concurrency (2), not 3 and not 1.
    const columnCounts = new Set(result.map((p) => p.columnCount))
    expect(columnCounts.size).toBe(1)
    expect([...columnCounts][0]).toBe(2)
  })
})
