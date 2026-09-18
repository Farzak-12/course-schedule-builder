import { useMemo } from 'react'
import type { Weekday } from '@/types'
import type { GridBlock } from '@/lib/grid'
import { layoutDayColumns } from '@/lib/layout/columnLayout'
import { ClassBlock } from './ClassBlock'

interface DayColumnProps {
  day: Weekday
  blocks: GridBlock[]
  clashedSectionIds: Set<string>
  startMin: number
  endMin: number
}

interface DayLayoutBlock {
  id: string
  startMin: number
  endMin: number
  payload: GridBlock
}

export function DayColumn({ day, blocks, clashedSectionIds, startMin, endMin }: DayColumnProps) {
  const positioned = useMemo(
    () =>
      layoutDayColumns<DayLayoutBlock>(
        blocks.map((b) => ({
          id: `${b.sectionId}|${b.meeting.day}|${b.meeting.startMin}`,
          startMin: b.meeting.startMin,
          endMin: b.meeting.endMin,
          payload: b,
        })),
      ),
    [blocks],
  )

  const totalMin = endMin - startMin

  return (
    <div className="relative flex-1 min-w-0 border-l border-border">
      <div className="sticky top-0 z-10 border-b border-border bg-bg px-2 py-1.5 text-center font-display text-sm text-text">
        {day}
      </div>
      <div className="relative" style={{ height: `${totalMin}px` }}>
        {positioned.map((p) => {
          const block = p.block.payload
          return (
            <ClassBlock
              key={p.block.id}
              block={block}
              top={((block.meeting.startMin - startMin) / totalMin) * 100}
              height={((block.meeting.endMin - block.meeting.startMin) / totalMin) * 100}
              left={p.leftPercent}
              width={p.widthPercent}
              isClashed={clashedSectionIds.has(block.sectionId)}
            />
          )
        })}
      </div>
    </div>
  )
}
