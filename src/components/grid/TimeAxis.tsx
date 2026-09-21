import { minutesToTimeString } from '@/lib/time'

interface TimeAxisProps {
  startMin: number
  endMin: number
}

export function TimeAxis({ startMin, endMin }: TimeAxisProps) {
  const hours: number[] = []
  for (let h = Math.floor(startMin / 60); h * 60 <= endMin; h++) hours.push(h * 60)

  return (
    <div className="relative w-14 shrink-0 text-right" style={{ height: `${endMin - startMin}px` }}>
      {hours.map((min) => (
        <div
          key={min}
          className="absolute right-2 -translate-y-1/2 font-mono text-[11px] text-text-muted"
          style={{ top: `${((min - startMin) / (endMin - startMin)) * 100}%` }}
        >
          {minutesToTimeString(min)}
        </div>
      ))}
    </div>
  )
}
