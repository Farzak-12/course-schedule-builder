import type { Section } from '@/types'
import { minutesToTimeString } from '@/lib/time'

/** Renders a section's real meeting times inline, e.g. "Mon 09:00–10:50 · Wed 09:00–10:50 (A204)". */
export function MeetingTimes({ section }: { section: Section }) {
  return (
    <span className="font-mono text-xs text-text-muted">
      {section.meetings
        .map(
          (m) =>
            `${m.day} ${minutesToTimeString(m.startMin)}–${minutesToTimeString(m.endMin)}${m.room ? ` (${m.room})` : ''}`,
        )
        .join(' · ')}
    </span>
  )
}
