import { Check, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cellState, scoreWindow, type RankResult } from '../../lib/rank'
import { dayParts, formatRange, formatTime, slotsPerDay, slotsPerWindow, slotStartMin } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { cn } from '../ui/cn'

export type HeatMode = 'attend' | 'prefer'
export interface WindowRef {
  day: number
  startSlot: number
}

const same = (a?: WindowRef | null, b?: WindowRef | null) => !!a && !!b && a.day === b.day && a.startSlot === b.startSlot

export function GroupHeatmap({
  poll,
  result,
  mode,
  focusPerson,
  highlight,
  selected,
  onSelect,
  cellHeight = 22,
  className,
}: {
  poll: Poll
  result: RankResult
  mode: HeatMode
  focusPerson?: string | null
  highlight?: WindowRef | null
  selected?: WindowRef | null
  onSelect?: (w: WindowRef) => void
  cellHeight?: number
  className?: string
}) {
  const slots = slotsPerDay(poll)
  const span = slotsPerWindow(poll.duration)
  const total = poll.responses.length
  const days = useMemo(() => poll.dates.map((_, i) => i), [poll.dates])
  const [hover, setHover] = useState<WindowRef | null>(null)
  const [focus, setFocus] = useState<{ d: number; s: number }>({ d: 0, s: 0 })
  const gridRef = useRef<HTMLDivElement>(null)

  const person = focusPerson ? poll.responses.find((r) => r.id === focusPerson) : undefined

  // per-cell aggregates
  const matrix = useMemo(() => {
    return days.map((d) =>
      Array.from({ length: slots }, (_, s) => {
        let avail = 0
        let pref = 0
        for (const r of poll.responses) {
          const st = cellState(r, d, s)
          if (st > 0) avail++
          if (st === 2) pref++
        }
        return { avail, pref }
      }),
    )
  }, [poll.responses, slots, days])

  const toWindow = (d: number, s: number): WindowRef => ({ day: d, startSlot: Math.max(0, Math.min(s, slots - span)) })

  const hoverScore = hover ? scoreWindow(poll, hover.day, hover.startSlot) : null
  const pins = result.ready ? result.options : []

  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
    if (e.key in moves) {
      e.preventDefault()
      const [dx, dy] = moves[e.key]
      const next = { d: Math.max(0, Math.min(days.length - 1, focus.d + dx)), s: Math.max(0, Math.min(slots - 1, focus.s + dy)) }
      setFocus(next)
      setHover(toWindow(next.d, next.s))
      requestAnimationFrame(() =>
        gridRef.current?.querySelector<HTMLElement>(`[data-d="${next.d}"][data-s="${next.s}"]`)?.focus(),
      )
    } else if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault()
      onSelect(toWindow(focus.d, focus.s))
    } else if (e.key === 'Escape') {
      setHover(null)
    }
  }

  const fill = (d: number, s: number) => {
    if (person) {
      const st = cellState(person, d, s)
      return st === 2 ? 'var(--color-pref)' : st === 1 ? undefined : 'transparent'
    }
    if (total === 0) return 'transparent'
    const { avail, pref } = matrix[d][s]
    const ratio = mode === 'attend' ? avail / total : pref / total
    if (ratio === 0) return 'transparent'
    const pct = Math.round(12 + ratio * 88)
    return `color-mix(in oklch, var(--color-pref${ratio === 1 ? '-strong' : ''}) ${ratio === 1 ? 72 : pct}%, white)`
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={gridRef}
        role="grid"
        aria-label={`Group availability heatmap. ${total} responses. Arrow keys move${onSelect ? ', Enter chooses a time' : ''}.`}
        className="relative grid select-none"
        style={{
          gridTemplateColumns: `52px repeat(${days.length}, minmax(52px, 1fr))`,
          gridTemplateRows: `auto repeat(${slots}, ${cellHeight}px)`,
        }}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
        <div role="row" className="contents">
          <div role="columnheader" style={{ gridColumn: 1, gridRow: 1 }} />
          {days.map((d) => {
            const p = dayParts(poll.dates[d])
            return (
              <div key={d} role="columnheader" className="flex flex-col items-center pb-2" style={{ gridColumn: d + 2, gridRow: 1 }}>
                <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3">{p.weekday}</span>
                <span className="text-lg font-semibold tnum">{p.dayNum}</span>
              </div>
            )
          })}
        </div>

        {Array.from({ length: slots }, (_, s) => {
          const isHour = (poll.dayStartMin + s * 30) % 60 === 0
          return (
            <div role="row" key={s} className="contents">
              <div role="rowheader" className="pe-2 text-end" style={{ gridColumn: 1, gridRow: s + 2 }}>
                {isHour && (
                  <span className="relative -top-[7px] text-2xs font-medium text-fg-3 tnum">
                    {formatTime(slotStartMin(poll, s), { compact: true })}
                  </span>
                )}
              </div>
              {days.map((d) => {
                const { avail, pref } = matrix[d][s]
                const bg = fill(d, s)
                const personWorks = person && cellState(person, d, s) === 1
                return (
                  <div
                    key={d}
                    role="gridcell"
                    data-d={d}
                    data-s={s}
                    tabIndex={focus.d === d && focus.s === s ? 0 : -1}
                    aria-label={`${dayParts(poll.dates[d]).medium} ${formatTime(slotStartMin(poll, s))}: ${avail} of ${total} available, ${pref} preferred`}
                    className={cn(
                      'relative border-l border-line outline-none transition-[background-color,opacity] duration-200',
                      isHour ? 'border-t border-t-line-strong/80' : 'border-t border-dashed border-t-line',
                      s === slots - 1 && 'border-b border-b-line-strong/80',
                      personWorks && 'hatch',
                      onSelect && 'cursor-pointer',
                      'focus-visible:z-10 focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)]',
                    )}
                    style={{ gridColumn: d + 2, gridRow: s + 2, background: personWorks ? undefined : bg }}
                    onPointerEnter={() => setHover(toWindow(d, s))}
                    onClick={() => onSelect?.(toWindow(d, s))}
                  >
                    {mode === 'prefer' && !person && pref > 0 && cellHeight >= 20 && (
                      <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-pref-ink/70 tnum">
                        {pref}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* rank pins */}
        {pins.map((o) => (
          <div
            key={o.key}
            aria-hidden
            className="pointer-events-none relative z-[12]"
            style={{ gridColumn: o.day + 2, gridRow: `${o.startSlot + 2} / span ${o.slots}` }}
          >
            <span className="absolute -top-2 -left-2 grid size-[18px] place-items-center rounded-full bg-ink text-[10px] font-semibold text-white shadow-[0_0_0_2px_white] tnum">
              <span className="glyph">{o.rank}</span>
            </span>
            <span className="absolute inset-[1px] rounded-[6px] shadow-[inset_0_0_0_1.5px_rgb(22_22_22/0.55)]" />
          </div>
        ))}

        {/* linked highlight from option cards — glides between windows */}
        {(highlight || selected) && (
          <motion.div
            layoutId="heat-highlight"
            key="highlight"
            aria-hidden
            className="pointer-events-none relative z-[14] rounded-[8px] shadow-[0_0_0_2.5px_var(--color-ink),0_6px_16px_-4px_rgb(0_0_0/0.25)]"
            style={{
              gridColumn: (highlight ?? selected)!.day + 2,
              gridRow: `${(highlight ?? selected)!.startSlot + 2} / span ${span}`,
            }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.12 }}
          />
        )}

        {/* hover window (instant — it moves constantly) */}
        {hover && !same(hover, highlight) && (
          <div
            aria-hidden
            className="pointer-events-none relative z-[13] rounded-[7px] shadow-[0_0_0_2px_var(--color-accent)]"
            style={{ gridColumn: hover.day + 2, gridRow: `${hover.startSlot + 2} / span ${span}` }}
          />
        )}

        {/* who-can-come popover, anchored beside the hovered window */}
        <AnimatePresence>
          {hover && hoverScore && (
            <div
              key="pop-anchor"
              aria-hidden
              className="pointer-events-none relative z-30"
              style={{ gridColumn: hover.day + 2, gridRow: `${hover.startSlot + 2} / span ${span}` }}
            >
              <WindowPopover
                poll={poll}
                score={hoverScore}
                total={total}
                side={hover.day >= days.length / 2 ? 'left' : 'right'}
                up={hover.startSlot > slots / 2}
                selectable={!!onSelect}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function WindowPopover({
  poll,
  score,
  total,
  side,
  up,
  selectable,
}: {
  poll: Poll
  score: ReturnType<typeof scoreWindow>
  total: number
  side: 'left' | 'right'
  up: boolean
  selectable: boolean
}) {
  const p = dayParts(poll.dates[score.day])
  const start = slotStartMin(poll, score.startSlot)
  const groups = [
    { key: 'p', label: 'Preferred', icon: <Star fill="currentColor" size={11} />, people: score.people.filter((x) => x.state === 2), tone: 'bg-pref text-pref-ink' },
    { key: 'w', label: 'Works', icon: <Check strokeWidth={2.5} size={11} />, people: score.people.filter((x) => x.state === 1), tone: 'hatch text-works-ink' },
    { key: 'u', label: 'Can’t', icon: <X strokeWidth={2.5} size={11} />, people: score.people.filter((x) => x.state === 0), tone: 'bg-black/[0.06] text-fg-3' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'absolute w-[240px] rounded-[16px] bg-surface p-4 shadow-pop',
        up ? 'bottom-0' : 'top-0',
        side === 'right' ? 'left-[calc(100%+8px)]' : 'right-[calc(100%+8px)]',
        up ? (side === 'right' ? 'origin-bottom-left' : 'origin-bottom-right') : side === 'right' ? 'origin-top-left' : 'origin-top-right',
      )}
    >
      <div className="text-xs font-medium text-fg-3">{p.medium}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-md font-semibold tnum">{formatRange(start, start + poll.duration)}</span>
        <span className="text-sm font-semibold text-fg-2 tnum">
          {score.attendance}/{total}
        </span>
      </div>
      {/* groups 12px apart, contents 6px apart (≥ 2× rule) */}
      <div className="mt-3 flex flex-col gap-3">
        {groups.map((g) =>
          g.people.length === 0 ? null : (
            <div key={g.key}>
              <div className="flex h-[18px] items-center gap-1.5">
                <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-[5px]', g.tone)}>{g.icon}</span>
                <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3">
                  {g.label} <span className="text-fg-4 tnum">{g.people.length}</span>
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {g.people.map((x) => (
                  <span key={x.responseId} className="inline-flex h-6 items-center gap-1 rounded-full bg-sunken ps-0.5 pe-2 text-xs">
                    <Avatar name={x.name} size="xs" />
                    {x.name}
                  </span>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
      {selectable && <div className="mt-3 border-t border-dashed border-line-strong pt-3 text-2xs text-fg-3">Click to choose this time</div>}
    </motion.div>
  )
}
