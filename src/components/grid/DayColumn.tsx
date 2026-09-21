import { useMemo } from 'react'
import type { Weekday } from '@/types'
import { WEEKDAY_FULL, WEEKDAY_TR } from '@/types'
import type { GridBlock } from '@/lib/grid'
import { layoutDayColumns } from '@/lib/layout/columnLayout'
import { WarningIcon } from '@/components/common/icons'
import { ClassBlock } from './ClassBlock'

interface DayColumnProps {
  day: Weekday
  blocks: GridBlock[]
  clashedSectionIds: Set<string>
  clashCount: number
  startMin: number
  endMin: number
}

interface DayLayoutBlock {
  id: string
  startMin: number
  endMin: number
  payload: GridBlock
}

export function DayColumn({ day, blocks, clashedSectionIds, clashCount, startMin, endMin }: DayColumnProps) {
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
      <div className="sticky top-0 z-10 flex h-14 flex-col items-center justify-center border-b border-border bg-bg px-2 text-center">
        <div className="font-display text-sm font-medium text-text">{WEEKDAY_FULL[day]}</div>
        <div className="font-mono text-[10px] uppercase tracking-wide text-text-muted">{WEEKDAY_TR[day]}</div>
        {clashCount > 0 && (
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-medium text-clash">
            <WarningIcon className="h-2.5 w-2.5" />
            {clashCount} {clashCount === 1 ? 'clash' : 'clashes'}
          </div>
        )}
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
