export interface LayoutBlock {
  id: string
  startMin: number
  endMin: number
}

export interface PositionedBlock<T extends LayoutBlock> {
  block: T
  columnIndex: number
  columnCount: number
  leftPercent: number
  widthPercent: number
}

/**
 * Lays out same-day overlapping blocks into side-by-side columns (the standard calendar-overlap
 * algorithm): group blocks into maximal overlap clusters, then greedily assign each block to the
 * first column that's free by its start time. A block's width is driven by its cluster's peak
 * concurrency, not just its own pairwise overlaps, so 3-way+ overlaps render correctly.
 */
export function layoutDayColumns<T extends LayoutBlock>(blocks: T[]): PositionedBlock<T>[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const clusters: T[][] = []
  let currentCluster: T[] = []
  let clusterEnd = -Infinity

  for (const block of sorted) {
    if (currentCluster.length === 0 || block.startMin < clusterEnd) {
      currentCluster.push(block)
      clusterEnd = Math.max(clusterEnd, block.endMin)
    } else {
      clusters.push(currentCluster)
      currentCluster = [block]
      clusterEnd = block.endMin
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster)

  const positioned: PositionedBlock<T>[] = []

  for (const cluster of clusters) {
    const columnEnds: number[] = []
    const columnIndexByBlockId = new Map<string, number>()

    for (const block of cluster) {
      let columnIndex = columnEnds.findIndex((end) => end <= block.startMin)
      if (columnIndex === -1) {
        columnIndex = columnEnds.length
        columnEnds.push(block.endMin)
      } else {
        columnEnds[columnIndex] = block.endMin
      }
      columnIndexByBlockId.set(block.id, columnIndex)
    }

    const columnCount = columnEnds.length
    for (const block of cluster) {
      const columnIndex = columnIndexByBlockId.get(block.id)!
      positioned.push({
        block,
        columnIndex,
        columnCount,
        leftPercent: (columnIndex / columnCount) * 100,
        widthPercent: 100 / columnCount,
      })
    }
  }

  return positioned
}
