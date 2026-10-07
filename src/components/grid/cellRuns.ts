import { cellKey } from '../../lib/time'
import type { Cells } from '../../lib/types'

export interface Run {
  day: number
  start: number
  length: number
  value: 1 | 2
}

/** Contiguous same-state slots in one day → one block, so painted time reads like calendar events. */
export function runsForDay(cells: Cells, day: number, slots: number): Run[] {
  const runs: Run[] = []
  let cur: Run | null = null
  for (let s = 0; s < slots; s++) {
    const v = cells[cellKey(day, s)]
    if (v && cur && cur.value === v) {
      cur.length++
    } else {
      if (cur) runs.push(cur)
      cur = v ? { day, start: s, length: 1, value: v } : null
    }
  }
  if (cur) runs.push(cur)
  return runs
}

export function countCells(cells: Cells) {
  let preferred = 0
  let works = 0
  for (const v of Object.values(cells)) {
    if (v === 2) preferred++
    else if (v === 1) works++
  }
  return { preferred, works }
}
