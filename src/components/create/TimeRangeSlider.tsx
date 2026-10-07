import NumberFlow from '@number-flow/react'
import { motion } from 'motion/react'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatTime } from '../../lib/time'
import { cn } from '../ui/cn'

const MIN = 0
const MAX = 24 * 60
const STEP = 30

function FlowTime({ min }: { min: number }) {
  const m = min % 1440
  const h24 = Math.floor(m / 60)
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = m % 60
  const ap = min === 1440 || h24 < 12 ? 'AM' : 'PM'
  return (
    <span className="inline-flex items-baseline tnum">
      <NumberFlow value={h} />
      <span>:</span>
      <NumberFlow value={mm} format={{ minimumIntegerDigits: 2 }} />
      <span className="ms-1 text-[0.8em] opacity-70">{ap}</span>
    </span>
  )
}

/** Dual-thumb, 30-minute-snapping daily time range. Thumbs keep at least one meeting-length apart. */
export function TimeRangeSlider({
  start,
  end,
  minGap,
  onChange,
}: {
  start: number
  end: number
  minGap: number
  onChange: (start: number, end: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<'start' | 'end' | null>(null)
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100

  const valueAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect()
    const raw = ((clientX - r.left) / r.width) * (MAX - MIN) + MIN
    return Math.round(raw / STEP) * STEP
  }

  const set = (thumb: 'start' | 'end', v: number) => {
    if (thumb === 'start') onChange(Math.max(MIN, Math.min(v, end - minGap)), end)
    else onChange(start, Math.min(MAX, Math.max(v, start + minGap)))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const v = valueAt(e.clientX)
    const thumb = Math.abs(v - start) <= Math.abs(v - end) ? 'start' : 'end'
    setActive(thumb)
    trackRef.current?.setPointerCapture(e.pointerId)
    set(thumb, v)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (active) set(active, valueAt(e.clientX))
  }
  const stop = () => setActive(null)

  const onKey = (thumb: 'start' | 'end') => (e: KeyboardEvent) => {
    const v = thumb === 'start' ? start : end
    const delta: Record<string, number> = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP, PageDown: -120, PageUp: 120 }
    if (e.key in delta) {
      e.preventDefault()
      set(thumb, v + delta[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      set(thumb, MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      set(thumb, MAX)
    }
  }

  const hours = (end - start) / 60

  return (
    <div>
      <div className="flex items-end justify-between">
        <div className="text-xl font-semibold tracking-[-0.02em]">
          <FlowTime min={start} /> <span className="text-fg-4">–</span> <FlowTime min={end} />
        </div>
        <div className="pb-1 text-sm text-fg-3 tnum">
          <NumberFlow value={hours} format={{ maximumFractionDigits: 1 }} /> hours a day
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative mt-5 h-10 cursor-pointer [touch-action:none] select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        {/* track with hour ticks */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="absolute inset-y-0 rounded-full bg-[linear-gradient(90deg,var(--color-pref),var(--color-pref-strong))]"
            style={{ left: `${pct(start)}%`, right: `${100 - pct(end)}%` }}
          />
        </div>
        {(['start', 'end'] as const).map((t) => {
          const v = t === 'start' ? start : end
          return (
            <motion.div
              key={t}
              role="slider"
              tabIndex={0}
              aria-label={t === 'start' ? 'Earliest time' : 'Latest time'}
              aria-valuemin={t === 'start' ? MIN : start + minGap}
              aria-valuemax={t === 'start' ? end - minGap : MAX}
              aria-valuenow={v}
              aria-valuetext={formatTime(v)}
              onKeyDown={onKey(t)}
              className={cn(
                'absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface',
                'shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_2px_6px_rgb(0_0_0/0.18)] outline-offset-2',
              )}
              style={{ left: `${pct(v)}%` }}
              animate={{ scale: active === t ? 1.18 : 1 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}
            >
              <span className="absolute inset-[7px] rounded-full bg-pref-strong" />
            </motion.div>
          )
        })}
      </div>
      <div className="relative mt-1 h-4 text-2xs text-fg-3 tnum">
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className={cn('absolute -translate-x-1/2 whitespace-nowrap', h === 0 && 'translate-x-0', h === 24 && '-translate-x-full')}
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 0 || h === 24 ? '12 AM' : h === 12 ? 'Noon' : formatTime(h * 60, { compact: true })}
          </span>
        ))}
      </div>
    </div>
  )
}
