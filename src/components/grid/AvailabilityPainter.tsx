import { Check, Star } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useSpring, type MotionValue } from 'motion/react'
import { memo, useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useFinePointer } from '../../lib/hooks'
import { cellKey, dayParts, formatRange, formatTime, slotsPerDay, slotStartMin } from '../../lib/time'
import type { Poll, Pref } from '../../lib/types'
import { cn } from '../ui/cn'
import { BrushSwatch } from './BrushDock'
import { runsForDay } from './cellRuns'
import type { Brush, PaintState } from './usePaintState'

type Pos = { di: number; s: number } // di = index into the visible `days` array

const STATE_LABEL = ['Unavailable', 'Works', 'Preferred'] as const

interface StrokeInfo {
  anchor: Pos
  current: Pos
  value: Pref
}

export function AvailabilityPainter({
  poll,
  paint,
  brush,
  days,
  cellHeight,
  className,
}: {
  poll: Poll
  paint: PaintState
  brush: Brush
  /** day indices to render (all on desktop, one on mobile) */
  days: number[]
  cellHeight: number
  className?: string
}) {
  const { cells } = paint
  const slots = slotsPerDay(poll)
  const gridRef = useRef<HTMLDivElement>(null)
  const stroke = useRef<{ pointerId: number; anchor: Pos; last: Pos; value: Pref } | null>(null)
  const [strokeInfo, setStrokeInfo] = useState<StrokeInfo | null>(null)
  const [focus, setFocus] = useState<Pos>({ di: 0, s: 0 })
  const [hovering, setHovering] = useState(false)
  const fine = useFinePointer()

  // pointer chip position (spring-follow, no re-renders)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 900, damping: 55, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 900, damping: 55, mass: 0.6 })

  const focusIndex = Math.min(focus.di, days.length - 1)

  const rect = useCallback(
    (a: Pos, b: Pos): [number, number][] => {
      const out: [number, number][] = []
      const [d0, d1] = [Math.min(a.di, b.di), Math.max(a.di, b.di)]
      const [s0, s1] = [Math.min(a.s, b.s), Math.max(a.s, b.s)]
      for (let di = d0; di <= d1; di++) for (let s = s0; s <= s1; s++) out.push([days[di], s])
      return out
    },
    [days],
  )

  const posFromElement = (el: Element | null): Pos | null => {
    const cell = el?.closest<HTMLElement>('[data-s]')
    if (!cell || !gridRef.current?.contains(cell)) return null
    return { di: Number(cell.dataset.di), s: Number(cell.dataset.s) }
  }

  const toggleValue = (cur: Pref): Pref => (brush === 0 ? 0 : cur === brush ? 0 : brush)

  const focusCell = (p: Pos) => {
    setFocus(p)
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-di="${p.di}"][data-s="${p.s}"]`)?.focus({ preventScroll: false })
    })
  }

  // ── pointer painting ────────────────────────────────────────
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (stroke.current || (e.pointerType === 'mouse' && e.button !== 0)) return // multi-touch protection
    const pos = posFromElement(e.target as Element)
    if (!pos) return
    e.preventDefault()
    const cur = (cells[cellKey(days[pos.di], pos.s)] ?? 0) as Pref
    // starting on a cell that already has this brush erases — When2meet muscle memory
    const value = toggleValue(cur)
    stroke.current = { pointerId: e.pointerId, anchor: pos, last: pos, value }
    gridRef.current?.setPointerCapture(e.pointerId)
    paint.begin()
    paint.preview(rect(pos, pos), value)
    setStrokeInfo({ anchor: pos, current: pos, value })
    setFocus(pos)
    px.set(e.clientX)
    py.set(e.clientY)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    px.set(e.clientX)
    py.set(e.clientY)
    const st = stroke.current
    if (!st || e.pointerId !== st.pointerId) return
    const pos = posFromElement(document.elementFromPoint(e.clientX, e.clientY))
    if (!pos || (pos.di === st.last.di && pos.s === st.last.s)) return
    st.last = pos
    paint.preview(rect(st.anchor, pos), st.value)
    setStrokeInfo({ anchor: st.anchor, current: pos, value: st.value })
  }

  const endStroke = (e: PointerEvent<HTMLDivElement>) => {
    const st = stroke.current
    if (!st || e.pointerId !== st.pointerId) return
    stroke.current = null
    paint.end()
    setStrokeInfo(null)
  }

  // ── keyboard (non-drag alternative, PRD §14) ────────────────
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = posFromElement(e.target as Element)
    if (!pos) return
    const move: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    if (e.key in move) {
      e.preventDefault()
      const [dx, dy] = move[e.key]
      const next = {
        di: Math.max(0, Math.min(days.length - 1, pos.di + dx)),
        s: Math.max(0, Math.min(slots - 1, pos.s + dy)),
      }
      if (e.shiftKey) paint.apply(rect(pos, next), brush)
      focusCell(next)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      focusCell({ di: pos.di, s: e.key === 'Home' ? 0 : slots - 1 })
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const cur = (cells[cellKey(days[pos.di], pos.s)] ?? 0) as Pref
      paint.apply([[days[pos.di], pos.s]], toggleValue(cur))
    }
  }

  const paintColumn = (di: number) => {
    const d = days[di]
    const all = Array.from({ length: slots }, (_, s) => [d, s] as [number, number])
    const already = brush !== 0 && all.every(([dd, s]) => cells[cellKey(dd, s)] === brush)
    paint.apply(all, already ? 0 : brush)
  }

  const stripes = useMemo(() => days.map((d) => runsForDay(cells, d, slots)), [cells, days, slots])

  const strokeLabel = strokeInfo ? describeStroke(poll, days, strokeInfo) : null
  const gutter = 52

  return (
    <div className={cn('relative', className)}>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Your availability. Use arrow keys to move, Space to paint, Shift plus arrows to paint while moving."
        aria-rowcount={slots + 1}
        aria-colcount={days.length + 1}
        data-brush={brush}
        className="painter-grid relative grid select-none"
        style={{
          gridTemplateColumns: `${gutter}px repeat(${days.length}, minmax(${days.length > 1 ? 64 : 120}px, 1fr))`,
          gridTemplateRows: `auto repeat(${slots}, ${cellHeight}px)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onKeyDown={onKeyDown}
      >
        {/* header row */}
        <div role="row" className="contents">
          <div role="columnheader" className="sticky left-0 z-20 bg-surface" style={{ gridColumn: 1, gridRow: 1 }} />
          {days.map((d, di) => {
            const p = dayParts(poll.dates[d])
            return (
              <div
                role="columnheader"
                key={d}
                // single-day (mobile) view already has date tabs — keep the header for AT only
                className={days.length === 1 ? 'sr-only' : 'px-1 pb-2'}
                style={{ gridColumn: di + 2, gridRow: 1 }}
              >
                <button
                  type="button"
                  onClick={() => paintColumn(di)}
                  aria-label={`Paint all of ${p.long} as ${brush === 0 ? 'cleared' : STATE_LABEL[brush]}`}
                  className="press group flex w-full flex-col items-center rounded-[10px] py-1.5 transition-colors hover:bg-black/[0.04]"
                >
                  <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3">{p.weekday}</span>
                  <span className="text-lg font-semibold tnum">{p.dayNum}</span>
                </button>
              </div>
            )
          })}
        </div>

        {/* slot rows */}
        {Array.from({ length: slots }, (_, s) => {
          const isHour = (poll.dayStartMin + s * 30) % 60 === 0
          return (
            <div role="row" key={s} className="contents">
              <div
                role="rowheader"
                className="sticky left-0 z-20 bg-surface pe-2 text-end [touch-action:pan-y]"
                style={{ gridColumn: 1, gridRow: s + 2 }}
                aria-label={formatTime(slotStartMin(poll, s))}
              >
                {isHour && (
                  <span className="relative -top-[7px] text-2xs font-medium text-fg-3 tnum">
                    {formatTime(slotStartMin(poll, s), { compact: true })}
                  </span>
                )}
              </div>
              {days.map((d, di) => (
                <PaintCell
                  key={d}
                  di={di}
                  s={s}
                  value={(cells[cellKey(d, s)] ?? 0) as Pref}
                  isHour={isHour}
                  isLast={s === slots - 1}
                  focused={focusIndex === di && focus.s === s}
                  label={`${dayParts(poll.dates[d]).medium}, ${formatTime(slotStartMin(poll, s))}`}
                  onClickAT={() => {
                    const cur = (cells[cellKey(d, s)] ?? 0) as Pref
                    paint.apply([[d, s]], toggleValue(cur))
                  }}
                />
              ))}
            </div>
          )
        })}

        {/* first-run hint — gone as soon as anything is painted */}
        <AnimatePresence>
          {Object.keys(cells).length === 0 && !strokeInfo && (
            <motion.div
              key="hint"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
              className="pointer-events-none z-[6] flex items-start justify-center pt-[min(160px,25%)]"
              style={{ gridColumn: `2 / span ${days.length}`, gridRow: `2 / span ${slots}` }}
            >
              <div className="flex items-center gap-2 rounded-full bg-surface/90 py-1.5 pe-3.5 ps-1.5 text-sm text-fg-2 shadow-raised backdrop-blur-sm">
                <BrushSwatch brush={brush} size={22} className="rounded-full" />
                {days.length > 1 ? 'Drag across the grid to paint · tap a day to fill it' : 'Drag up or down to paint'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* merged run blocks — purely visual, pointer-events: none */}
        {stripes.map((runs, di) =>
          runs.map((r) => (
            <RunBlock
              key={`${r.day}-${r.start}-${r.value}`}
              run={r}
              col={di + 2}
              cellHeight={cellHeight}
              label={formatRange(slotStartMin(poll, r.start), slotStartMin(poll, r.start + r.length))}
            />
          )),
        )}
      </div>

      <PointerChip
        x={sx}
        y={sy}
        visible={fine && (hovering || !!strokeInfo)}
        brush={strokeInfo ? (strokeInfo.value as Brush) : brush}
        label={strokeLabel}
      />
      {!fine && (
        <AnimatePresence>
          {strokeLabel && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="pointer-events-none fixed top-[max(12px,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2"
            >
              <ChipBody brush={strokeInfo!.value as Brush} label={strokeLabel} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

const PaintCell = memo(function PaintCell({
  di,
  s,
  value,
  isHour,
  isLast,
  focused,
  label,
  onClickAT,
}: {
  di: number
  s: number
  value: Pref
  isHour: boolean
  isLast: boolean
  focused: boolean
  label: string
  onClickAT: () => void
}) {
  return (
    <button
      type="button"
      role="gridcell"
      data-di={di}
      data-s={s}
      tabIndex={focused ? 0 : -1}
      aria-label={`${label}, ${STATE_LABEL[value]}`}
      aria-selected={value > 0}
      style={{ gridColumn: di + 2, gridRow: s + 2 }}
      // pointer painting happens on the grid; this only catches AT / keyboard-synthesised clicks
      onClick={(e) => e.detail === 0 && onClickAT()}
      className={cn(
        'paint-cell relative border-l border-line [touch-action:none] outline-none',
        isHour ? 'border-t border-t-line-strong/80' : 'border-t border-t-line border-dashed',
        isLast && 'border-b border-b-line-strong/80',
        'focus-visible:z-10 focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)]',
      )}
    />
  )
})

function RunBlock({ run, col, cellHeight, label }: { run: { start: number; length: number; value: 1 | 2 }; col: number; cellHeight: number; label: string }) {
  const h = run.length * cellHeight
  const showLabel = h >= 40
  return (
    <div
      aria-hidden
      className={cn(
        'run-block pointer-events-none relative z-[5] mx-[3px] my-[2px] overflow-hidden rounded-[8px]',
        run.value === 2
          ? 'bg-pref text-pref-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_0_0_1px_var(--color-pref-strong)]'
          : 'hatch text-works-ink shadow-[inset_0_0_0_1px_var(--color-works-line)]',
      )}
      style={{ gridColumn: col, gridRow: `${run.start + 2} / span ${run.length}` }}
    >
      <div className={cn('flex items-start gap-1 px-1.5', h >= 22 ? 'pt-1' : 'h-full items-center pt-0')}>
        <span className={cn('grid shrink-0 place-items-center', run.value === 1 && 'rounded-[4px] bg-works')}>
          {run.value === 2 ? <Star fill="currentColor" size={11} /> : <Check strokeWidth={2.5} size={11} />}
        </span>
        {showLabel && (
          <span className={cn('truncate text-2xs font-semibold leading-[13px] tnum', run.value === 1 && 'rounded-[4px] bg-works px-0.5')}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

function ChipBody({ brush, label }: { brush: Brush; label?: string | null }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-ink/92 py-1 pe-2.5 ps-1 text-xs font-medium text-white shadow-raised backdrop-blur-md">
      <BrushSwatch brush={brush} size={18} className="rounded-full" />
      {label ? <span className="tnum">{label}</span> : <span className="pe-0.5">{brush === 2 ? 'Preferred' : brush === 1 ? 'Works' : 'Erase'}</span>}
    </div>
  )
}

function PointerChip({
  x,
  y,
  visible,
  brush,
  label,
}: {
  x: MotionValue<number>
  y: MotionValue<number>
  visible: boolean
  brush: Brush
  label: string | null
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{ x, y }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.9 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="translate-x-4 translate-y-4 origin-top-left"
      >
        <ChipBody brush={brush} label={label} />
      </motion.div>
    </motion.div>
  )
}

function describeStroke(poll: Poll, days: number[], info: StrokeInfo) {
  const [d0, d1] = [Math.min(info.anchor.di, info.current.di), Math.max(info.anchor.di, info.current.di)]
  const [s0, s1] = [Math.min(info.anchor.s, info.current.s), Math.max(info.anchor.s, info.current.s)]
  const a = dayParts(poll.dates[days[d0]]).weekday
  const b = dayParts(poll.dates[days[d1]]).weekday
  const dayLabel = d0 === d1 ? a : `${a}–${b}`
  const time = formatRange(slotStartMin(poll, s0), slotStartMin(poll, s1 + 1))
  const verb = info.value === 0 ? 'Clear ' : ''
  return `${verb}${dayLabel} · ${time}`
}
