import { describe, expect, it } from 'vitest'
import type { Meeting } from '@/types'
import { mergeAdjacentMeetings } from './meetings'

function meeting(day: Meeting['day'], start: number, end: number, room = 'LB211'): Meeting {
  return { day, startMin: start, endMin: end, room }
}

describe('mergeAdjacentMeetings', () => {
  it('merges two back-to-back same-room periods into one continuous block', () => {
    // 13:00-13:45 then 14:00-14:45 in the same room — a 15-minute passing gap, same session.
    const merged = mergeAdjacentMeetings([meeting('Tue', 780, 825), meeting('Tue', 840, 885)])
    expect(merged).toEqual([meeting('Tue', 780, 885)])
  })

  it('merges three consecutive periods into a single span', () => {
    const merged = mergeAdjacentMeetings([
      meeting('Mon', 540, 585),
      meeting('Mon', 600, 645),
      meeting('Mon', 660, 705),
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(meeting('Mon', 540, 705))
  })

  it('does not merge meetings separated by a real gap (a free period in between)', () => {
    const merged = mergeAdjacentMeetings([meeting('Mon', 540, 585), meeting('Mon', 660, 705)])
    expect(merged).toHaveLength(2)
  })

  it('does not merge adjacent periods in different rooms', () => {
    const merged = mergeAdjacentMeetings([meeting('Mon', 780, 825, 'LB211'), meeting('Mon', 840, 885, 'F0F18')])
    expect(merged).toHaveLength(2)
  })

  it('does not merge across different days even at the same time', () => {
    const merged = mergeAdjacentMeetings([meeting('Mon', 540, 585), meeting('Wed', 540, 585)])
    expect(merged).toHaveLength(2)
  })

  it('leaves a single meeting untouched', () => {
    const merged = mergeAdjacentMeetings([meeting('Fri', 540, 585)])
    expect(merged).toEqual([meeting('Fri', 540, 585)])
  })
})
