import { format, parseISO } from 'date-fns'
import type { CellKey, Poll } from './types'

export const SLOT_MIN = 30

export const cellKey = (day: number, slot: number): CellKey => `${day}:${slot}`

export function slotsPerDay(poll: Pick<Poll, 'dayStartMin' | 'dayEndMin'>) {
  return Math.max(0, Math.floor((poll.dayEndMin - poll.dayStartMin) / SLOT_MIN))
}

export const slotsPerWindow = (duration: number) => Math.max(1, Math.round(duration / SLOT_MIN))

export const slotStartMin = (poll: Pick<Poll, 'dayStartMin'>, slot: number) =>
  poll.dayStartMin + slot * SLOT_MIN

/** "7:00 PM" */
export function formatTime(min: number, opts: { compact?: boolean; meridiem?: boolean } = {}) {
  const { compact = false, meridiem = true } = opts
  const m = ((min % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mm = m % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const ap = h24 < 12 ? 'AM' : 'PM'
  const base = compact && mm === 0 ? `${h12}` : `${h12}:${String(mm).padStart(2, '0')}`
  return meridiem ? `${base} ${ap}` : base
}

/** "7:00 – 8:30 PM" (meridiem shared when equal) */
export function formatRange(startMin: number, endMin: number) {
  const sameHalf = Math.floor(startMin / 720) === Math.floor((endMin - 1) / 720) && endMin % 1440 !== 0
  if (sameHalf) return `${formatTime(startMin, { meridiem: false })} – ${formatTime(endMin)}`
  return `${formatTime(startMin)} – ${formatTime(endMin)}`
}

export function dayParts(iso: string) {
  const d = parseISO(iso)
  return {
    weekday: format(d, 'EEE'),
    weekdayLong: format(d, 'EEEE'),
    month: format(d, 'MMM'),
    dayNum: format(d, 'd'),
    short: format(d, 'MMM d'),
    long: format(d, 'EEEE, MMM d'),
    medium: format(d, 'EEE, MMM d'),
  }
}

export function windowLabel(poll: Pick<Poll, 'dates' | 'dayStartMin'>, day: number, startSlot: number, duration: number) {
  const start = slotStartMin(poll, startSlot)
  const parts = dayParts(poll.dates[day])
  return {
    ...parts,
    start,
    end: start + duration,
    time: formatTime(start),
    range: formatRange(start, start + duration),
  }
}

/** 30 → "30 min", 60 → "1 hr", 90 → "1.5 hr" */
export function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  return `${min / 60} hr`
}

export function dateRangeLabel(dates: string[]) {
  if (dates.length === 0) return 'No days yet'
  const first = dayParts(dates[0])
  const last = dayParts(dates[dates.length - 1])
  if (dates.length === 1) return first.medium
  return `${first.medium} – ${last.medium}`
}
