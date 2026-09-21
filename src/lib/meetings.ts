import type { Meeting } from '@/types'

/** Some schedule exports list one continuous class as several fixed-length period rows (e.g. a
 *  90-minute class printed as two adjacent 45-minute slots with a short passing-time gap). Treat
 *  same-day, same-room meetings that are adjacent or overlapping as one continuous block instead
 *  of rendering them as separate stacked entries. */
const MAX_PASSING_GAP_MIN = 15

export function mergeAdjacentMeetings(meetings: Meeting[]): Meeting[] {
  const byDay = new Map<string, Meeting[]>()
  for (const meeting of meetings) {
    const list = byDay.get(meeting.day) ?? []
    list.push(meeting)
    byDay.set(meeting.day, list)
  }

  const result: Meeting[] = []
  for (const dayMeetings of byDay.values()) {
    const sorted = [...dayMeetings].sort((a, b) => a.startMin - b.startMin)
    let current: Meeting | null = null
    for (const meeting of sorted) {
      if (current && meeting.room === current.room && meeting.startMin - current.endMin <= MAX_PASSING_GAP_MIN) {
        const prev: Meeting = current
        current = { day: prev.day, room: prev.room, startMin: prev.startMin, endMin: Math.max(prev.endMin, meeting.endMin) }
      } else {
        if (current) result.push(current)
        current = { ...meeting }
      }
    }
    if (current) result.push(current)
  }

  return result.sort((a, b) => a.day.localeCompare(b.day) || a.startMin - b.startMin)
}
