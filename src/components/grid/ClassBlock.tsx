import type { GridBlock } from '@/lib/grid'
import { minutesToTimeString } from '@/lib/time'

interface ClassBlockProps {
  block: GridBlock
  top: number
  height: number
  left: number
  width: number
  isClashed: boolean
}

export function ClassBlock({ block, top, height, left, width, isClashed }: ClassBlockProps) {
  return (
    <div
      className={`absolute overflow-hidden rounded-md border px-1.5 py-1 text-left transition-colors ${
        isClashed
          ? 'border-2 border-dashed border-clash bg-clash-bg'
          : 'border-border bg-accent/15 dark:bg-accent/20'
      }`}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      {isClashed && (
        <span className="mb-0.5 inline-block rounded bg-clash px-1 text-[9px] font-semibold uppercase tracking-wide text-white">
          Clash
        </span>
      )}
      <div className="font-mono text-[11px] font-semibold leading-tight text-text">
        {block.courseCode} <span className="font-normal text-text-muted">Şb.{block.sectionLabel}</span>
      </div>
      <div className="font-mono text-[10px] leading-tight text-text-muted">
        {minutesToTimeString(block.meeting.startMin)}–{minutesToTimeString(block.meeting.endMin)}
      </div>
      {block.meeting.room && (
        <div className="font-mono text-[10px] leading-tight text-text-muted">{block.meeting.room}</div>
      )}
    </div>
  )
}
