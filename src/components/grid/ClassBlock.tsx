import type { GridBlock } from '@/lib/grid'
import { minutesToTimeString } from '@/lib/time'
import { courseColor } from '@/lib/courseColor'
import { WarningIcon } from '@/components/common/icons'

interface ClassBlockProps {
  block: GridBlock
  top: number
  height: number
  left: number
  width: number
  isClashed: boolean
}

export function ClassBlock({ block, top, height, left, width, isClashed }: ClassBlockProps) {
  const color = courseColor(block.courseCode)

  return (
    <div
      className={`absolute overflow-hidden rounded-lg px-2 py-1.5 text-left transition-colors ${
        isClashed ? 'border border-dashed border-clash bg-clash-bg' : 'border border-border bg-surface-raised'
      }`}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
        borderLeft: `3px solid ${isClashed ? 'var(--color-clash)' : color}`,
      }}
    >
      {isClashed && (
        <span className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-clash">
          <WarningIcon className="h-2.5 w-2.5" />
          Clash
        </span>
      )}
      <div className="font-mono text-[11px] font-semibold leading-tight text-text">
        {block.courseCode} <span className="font-normal text-text-muted">Şb.{block.sectionLabel}</span>
      </div>
      {block.meeting.room && (
        <div className="font-mono text-[10px] leading-tight text-text-muted">{block.meeting.room}</div>
      )}
      <div className="font-mono text-[10px] leading-tight text-text-muted">
        {minutesToTimeString(block.meeting.startMin)}–{minutesToTimeString(block.meeting.endMin)}
      </div>
    </div>
  )
}
