import { describe, expect, it } from 'vitest'
import { ladder, reasonFor } from './explain'
import { compareScore, rankPoll, scoreWindow, scoreWindows, windowState } from './rank'
import { buildSamplePoll } from './seed'
import { cellKey } from './time'
import type { Cells, Duration, Poll, PollResponse } from './types'

/** 1 day, 9:00–12:00 → 6 slots */
function poll(responses: Record<string, Cells>, opts: Partial<Poll> & { duration?: Duration } = {}): Poll {
  return {
    id: 't',
    adminToken: 'a',
    name: 'Test',
    organizerName: 'Org',
    dates: ['2026-10-12', '2026-10-13'],
    dayStartMin: 9 * 60,
    dayEndMin: 12 * 60,
    duration: 30,
    responses: Object.entries(responses).map(
      ([name, cells]): PollResponse => ({ id: name, name, cells, updatedAt: 0 }),
    ),
    status: 'open',
    createdAt: 0,
    ...opts,
  }
}

const c = (...entries: [day: number, slot: number, pref: 1 | 2][]): Cells =>
  Object.fromEntries(entries.map(([d, s, p]) => [cellKey(d, s), p]))

describe('window state (PRD §9)', () => {
  it('uses the weakest state inside a multi-slot window', () => {
    const r: PollResponse = { id: 'a', name: 'A', cells: c([0, 0, 2], [0, 1, 1]), updatedAt: 0 }
    expect(windowState(r, 0, 0, 2)).toBe(1) // Preferred + Works = Works
    expect(windowState(r, 0, 0, 1)).toBe(2)
    expect(windowState(r, 0, 1, 2)).toBe(0) // second half unselected
  })

  it('never treats unselected cells as available', () => {
    const p = poll({ A: {}, B: {} })
    expect(scoreWindows(p).every((w) => w.attendance === 0)).toBe(true)
  })

  it('only evaluates windows that fit the meeting duration', () => {
    const p = poll({ A: {} }, { duration: 60 })
    // 6 slots per day, 2-slot windows → 5 starts per day × 2 days
    expect(scoreWindows(p)).toHaveLength(10)
    const p2 = poll({ A: {} }, { duration: 120 })
    expect(scoreWindows(p2)).toHaveLength(6)
  })
})

describe('ranking (PRD §8 Feature 2)', () => {
  it('ranks attendance above preference', () => {
    const p = poll({
      A: c([0, 0, 1], [0, 1, 2]),
      B: c([0, 0, 1], [0, 1, 2]),
      C: c([0, 0, 1]),
    })
    const r = rankPoll(p)
    expect(r.options[0].startSlot).toBe(0) // 3/3 Works beats 2/3 Preferred
    expect(r.options[1].startSlot).toBe(1)
  })

  it('reproduces the PRD worked example (Tue 7 PM vs Wed 6 PM)', () => {
    // day 0 = "Tue", day 1 = "Wed"; 6 people
    const prefTue = ['A', 'B', 'C', 'D']
    const prefWed = ['A', 'B']
    const people = ['A', 'B', 'C', 'D', 'E', 'F']
    const responses = Object.fromEntries(
      people.map((n) => [n, c([0, 2, prefTue.includes(n) ? 2 : 1], [1, 4, prefWed.includes(n) ? 2 : 1])]),
    )
    const r = rankPoll(poll(responses))
    const [first, second] = r.options
    expect([first.day, first.attendance, first.preferred, first.works]).toEqual([0, 6, 4, 2])
    expect([second.day, second.attendance, second.preferred, second.works]).toEqual([1, 6, 2, 4])
    expect(reasonFor(poll(responses), r, 1).body).toMatch(/Everyone can attend, but fewer people prefer/)
    expect(ladder(second, first).decided).toBe('preference')
  })

  it('reports genuine ties as tied instead of inventing a winner', () => {
    const p = poll({
      A: c([0, 0, 2], [1, 0, 2]),
      B: c([0, 0, 1], [1, 0, 1]),
    })
    const r = rankPoll(p)
    expect(r.options[0].tied).toBe(true)
    expect(r.options[1].tied).toBe(true)
    expect(r.options[0].rank).toBe(r.options[1].rank)
  })

  it('applies the fairness step only after attendance and preference', () => {
    const a = { attendance: 3, prefScore: 4, works: 2 } as ReturnType<typeof scoreWindow>
    const b = { attendance: 3, prefScore: 4, works: 1 } as ReturnType<typeof scoreWindow>
    expect(compareScore(b, a)).toBeLessThan(0)
  })

  it('never contradicts the displayed counts', () => {
    const r = rankPoll(buildSamplePoll(Date.UTC(2026, 9, 5)))
    for (let i = 1; i < r.options.length; i++) {
      expect(compareScore(r.options[i - 1], r.options[i])).toBeLessThanOrEqual(0)
    }
  })

  it('suppresses overlapping near-duplicate windows', () => {
    const p = poll(
      {
        A: c([0, 0, 2], [0, 1, 2], [0, 2, 2]),
        B: c([0, 0, 2], [0, 1, 2], [0, 2, 2]),
      },
      { duration: 60 },
    )
    const r = rankPoll(p)
    // 9:00 and 9:30 windows tie, but overlap — only one is shown, the other is noted
    expect(r.options).toHaveLength(1)
    expect(r.options[0].nearbyEqual?.startSlot).toBe(1)
  })
})

describe('gates & edge cases (PRD §12)', () => {
  it('needs at least two responses', () => {
    expect(rankPoll(poll({ A: c([0, 0, 2]) })).ready).toBe(false)
    expect(rankPoll(poll({ A: c([0, 0, 2]), B: c([0, 0, 2]) })).ready).toBe(true)
  })

  it('is provisional while invitees are pending, until the organizer proceeds', () => {
    const base = poll({ A: c([0, 0, 2]), B: c([0, 0, 2]) }, { invitees: ['A', 'B', 'C'] })
    const r = rankPoll(base)
    expect(r.provisional).toBe(true)
    expect(r.pendingNames).toEqual(['C'])
    expect(r.invitedCount).toBe(3)
    expect(rankPoll({ ...base, proceedEarly: true }).provisional).toBe(false)
  })

  it('flags when no time works for everyone', () => {
    const r = rankPoll(poll({ A: c([0, 0, 2]), B: c([0, 1, 2]) }))
    expect(r.noFullCoverage).toBe(true)
    expect(r.bestAttendance).toBe(1)
  })
})

describe('sample poll story', () => {
  it('ranks Tue 7 PM, Wed 6 PM, Thu 4 PM', () => {
    const p = buildSamplePoll(Date.UTC(2026, 9, 5))
    const r = rankPoll({ ...p, proceedEarly: true })
    const slot = (h: number) => (h - 9) * 2
    expect(r.options.map((o) => [o.day, o.startSlot])).toEqual([
      [1, slot(19)],
      [2, slot(18)],
      [3, slot(16)],
    ])
    expect(r.options.map((o) => [o.attendance, o.preferred, o.works])).toEqual([
      [5, 4, 1],
      [5, 2, 3],
      [4, 3, 1],
    ])
    expect(ladder(r.options[2], r.options[1]).decided).toBe('attendance')
    expect(r.pendingNames).toEqual(['Alex'])
  })
})
