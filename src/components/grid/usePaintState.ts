import { useCallback, useRef, useState } from 'react'
import { cellKey } from '../../lib/time'
import type { Cells, Pref } from '../../lib/types'

export type Brush = 2 | 1 | 0

export function setCells(base: Cells, targets: [number, number][], value: Pref): Cells {
  const next = { ...base }
  for (const [d, s] of targets) {
    const k = cellKey(d, s)
    if (value === 0) delete next[k]
    else next[k] = value
  }
  return next
}

/**
 * Cells + stroke-level undo. A "stroke" begins with `begin()`, can be
 * previewed any number of times against its starting snapshot, and ends with `end()`.
 */
export function usePaintState(initial: Cells) {
  const [cells, setState] = useState<Cells>(initial)
  const current = useRef<Cells>(initial)
  const history = useRef<Cells[]>([])
  const snapshot = useRef<Cells | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const commit = useCallback((next: Cells) => {
    current.current = next
    setState(next)
  }, [])

  const pushHistory = useCallback((prev: Cells) => {
    history.current.push(prev)
    if (history.current.length > 60) history.current.shift()
    setCanUndo(true)
  }, [])

  const begin = useCallback(() => {
    snapshot.current = current.current
  }, [])

  const preview = useCallback(
    (targets: [number, number][], value: Pref) => {
      if (snapshot.current) commit(setCells(snapshot.current, targets, value))
    },
    [commit],
  )

  const end = useCallback(() => {
    const base = snapshot.current
    snapshot.current = null
    if (base && base !== current.current) pushHistory(base)
  }, [pushHistory])

  /** one-shot change (tap, keyboard, column header) */
  const apply = useCallback(
    (targets: [number, number][], value: Pref) => {
      pushHistory(current.current)
      commit(setCells(current.current, targets, value))
    },
    [commit, pushHistory],
  )

  const replace = useCallback(
    (next: Cells) => {
      pushHistory(current.current)
      commit(next)
    },
    [commit, pushHistory],
  )

  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (prev) commit(prev)
    setCanUndo(history.current.length > 0)
  }, [commit])

  return { cells, begin, preview, end, apply, replace, undo, canUndo }
}

export type PaintState = ReturnType<typeof usePaintState>
