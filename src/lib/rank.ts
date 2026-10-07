import { cellKey, slotsPerDay, slotsPerWindow } from './time'
import type { Poll, PollResponse, Pref } from './types'

/**
 * Deterministic, explainable ranking — PRD §8 Feature 2 + §9 Meeting Duration Logic.
 *
 *   1. Attendance   — more people available ranks higher
 *   2. Preference   — Preferred = 2, Works = 1, Unavailable = 0
 *   3. Fairness     — fewer "Works-only" participants ranks higher
 *
 * A participant's state for a multi-slot window is the WEAKEST state inside it.
 * Anything still equal after step 3 is reported as tied — no hidden tie-break.
 */

export interface PersonState {
  responseId: string
  name: string
  state: Pref
}

export interface WindowScore {
  key: string
  day: number
  startSlot: number
  slots: number
  attendance: number
  prefScore: number
  preferred: number
  works: number
  people: PersonState[]
}

export interface Recommendation extends WindowScore {
  /** 1-based rank; tied options share a rank */
  rank: number
  tied: boolean
  /** an overlapping window that scores exactly the same (suppressed to avoid near-duplicates) */
  nearbyEqual?: WindowScore
}

export type DecisiveStep = 'attendance' | 'preference' | 'fairness' | 'tied'

export interface RankResult {
  /** fewer than 2 responses → no recommendations yet */
  ready: boolean
  responded: number
  invitedCount: number | null
  pendingNames: string[]
  /** invite list exists, not everyone answered, organizer has not chosen to proceed */
  provisional: boolean
  noFullCoverage: boolean
  bestAttendance: number
  options: Recommendation[]
  /** further non-overlapping windows that tie with the last shown option */
  moreTied: number
  windows: WindowScore[]
}

export const MIN_RESPONSES = 2
export const MAX_OPTIONS = 3

export function cellState(resp: PollResponse, day: number, slot: number): Pref {
  return (resp.cells[cellKey(day, slot)] ?? 0) as Pref
}

/** Weakest state inside the window (PRD §9). */
export function windowState(resp: PollResponse, day: number, startSlot: number, slots: number): Pref {
  let min: Pref = 2
  for (let s = startSlot; s < startSlot + slots; s++) {
    const st = cellState(resp, day, s)
    if (st < min) min = st
    if (min === 0) return 0
  }
  return min
}

export function scoreWindow(poll: Poll, day: number, startSlot: number): WindowScore {
  const slots = slotsPerWindow(poll.duration)
  let attendance = 0
  let preferred = 0
  let works = 0
  const people: PersonState[] = poll.responses.map((r) => {
    const state = windowState(r, day, startSlot, slots)
    if (state > 0) attendance++
    if (state === 2) preferred++
    if (state === 1) works++
    return { responseId: r.id, name: r.name, state }
  })
  return {
    key: `${day}:${startSlot}`,
    day,
    startSlot,
    slots,
    attendance,
    preferred,
    works,
    prefScore: preferred * 2 + works,
    people,
  }
}

/** Every window that fits the meeting duration (PRD §9). */
export function scoreWindows(poll: Poll): WindowScore[] {
  const perDay = slotsPerDay(poll)
  const slots = slotsPerWindow(poll.duration)
  const out: WindowScore[] = []
  for (let day = 0; day < poll.dates.length; day++) {
    for (let start = 0; start + slots <= perDay; start++) {
      out.push(scoreWindow(poll, day, start))
    }
  }
  return out
}

/** negative → a ranks above b. 0 → genuinely tied on all three steps. */
export function compareScore(a: WindowScore, b: WindowScore): number {
  if (a.attendance !== b.attendance) return b.attendance - a.attendance
  if (a.prefScore !== b.prefScore) return b.prefScore - a.prefScore
  if (a.works !== b.works) return a.works - b.works
  return 0
}

/** Which ranking step separates a from b (or 'tied'). */
export function decisiveStep(a: WindowScore, b: WindowScore): DecisiveStep {
  if (a.attendance !== b.attendance) return 'attendance'
  if (a.prefScore !== b.prefScore) return 'preference'
  if (a.works !== b.works) return 'fairness'
  return 'tied'
}

const chronological = (a: WindowScore, b: WindowScore) => a.day - b.day || a.startSlot - b.startSlot

export function overlaps(a: WindowScore, b: WindowScore) {
  return a.day === b.day && a.startSlot < b.startSlot + b.slots && b.startSlot < a.startSlot + a.slots
}

export function rankPoll(poll: Poll): RankResult {
  const responded = poll.responses.length
  const respondedNames = new Set(poll.responses.map((r) => r.name.trim().toLowerCase()))
  const invitees = poll.invitees?.filter(Boolean) ?? []
  const pendingNames = invitees.filter((n) => !respondedNames.has(n.trim().toLowerCase()))
  const invitedCount = invitees.length > 0 ? Math.max(invitees.length, responded) : null
  const provisional = pendingNames.length > 0 && !poll.proceedEarly

  const windows = scoreWindows(poll)
  const base = {
    responded,
    invitedCount,
    pendingNames,
    provisional,
    windows,
  }

  if (responded < MIN_RESPONSES) {
    return { ...base, ready: false, noFullCoverage: false, bestAttendance: 0, options: [], moreTied: 0 }
  }

  // Score order first; equal scores fall back to chronological order for *display only*.
  const sorted = windows.filter((w) => w.attendance > 0).sort((a, b) => compareScore(a, b) || chronological(a, b))
  const bestAttendance = sorted[0]?.attendance ?? 0

  const picks: WindowScore[] = []
  const nearby = new Map<string, WindowScore>()
  let moreTied = 0

  for (const w of sorted) {
    const clash = picks.find((p) => overlaps(p, w))
    if (clash) {
      if (compareScore(clash, w) === 0 && !nearby.has(clash.key)) nearby.set(clash.key, w)
      continue
    }
    if (picks.length < MAX_OPTIONS) {
      picks.push(w)
    } else {
      if (compareScore(picks[picks.length - 1], w) === 0) moreTied++
      else break
    }
  }

  const options: Recommendation[] = picks.map((p) => {
    const better = picks.filter((q) => compareScore(q, p) < 0).length
    const tied = picks.some((q) => q !== p && compareScore(q, p) === 0)
    return { ...p, rank: better + 1, tied, nearbyEqual: nearby.get(p.key) }
  })
  if (moreTied > 0 && options.length > 0) options[options.length - 1].tied = true

  return {
    ...base,
    ready: true,
    noFullCoverage: bestAttendance < responded,
    bestAttendance,
    options,
    moreTied,
  }
}

/** Response ids that could attend the confirmed window *now*. */
export function confirmedAttendance(poll: Poll) {
  if (!poll.confirmed) return null
  const w = scoreWindow(poll, poll.confirmed.day, poll.confirmed.startSlot)
  const conflicts = w.people.filter(
    (p) => p.state === 0 && poll.confirmed!.attendeesAtConfirm.includes(p.responseId),
  )
  return { window: w, conflicts }
}
