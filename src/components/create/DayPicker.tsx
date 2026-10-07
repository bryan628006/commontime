import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useRef, useState, type PointerEvent } from 'react'
import { cn } from '../ui/cn'

export const MAX_DAYS = 14
const iso = (d: Date) => format(d, 'yyyy-MM-dd')

export function DayPicker({
  value,
  onChange,
  onLimit,
}: {
  value: string[]
  onChange: (days: string[]) => void
  onLimit?: () => void
}) {
  const today = startOfDay(new Date())
  const [month, setMonth] = useState(() => startOfMonth(value[0] ? new Date(value[0] + 'T00:00') : today))
  const [shake, setShake] = useState(false)
  const drag = useRef<{ mode: 'add' | 'remove'; pointerId: number; base: Set<string>; touched: Set<string> } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const selected = new Set(value)

  const weeks = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const commit = (next: Set<string>) => {
    if (next.size > MAX_DAYS) {
      setShake(true)
      onLimit?.()
      return false
    }
    onChange([...next].sort())
    return true
  }

  const dayFrom = (el: Element | null) => el?.closest<HTMLElement>('[data-iso]')?.dataset.iso

  const apply = (d: string) => {
    const st = drag.current
    if (!st || st.touched.has(d)) return
    st.touched.add(d)
    const next = new Set(st.base)
    for (const t of st.touched) {
      if (st.mode === 'add') next.add(t)
      else next.delete(t)
    }
    if (!commit(next)) st.touched.delete(d)
  }

  const onPointerDown = (e: PointerEvent) => {
    const d = dayFrom(e.target as Element)
    if (!d || drag.current) return
    const btn = (e.target as Element).closest('button')
    if (btn?.hasAttribute('disabled')) return
    e.preventDefault()
    drag.current = { mode: selected.has(d) ? 'remove' : 'add', pointerId: e.pointerId, base: new Set(selected), touched: new Set() }
    gridRef.current?.setPointerCapture(e.pointerId)
    apply(d)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || e.pointerId !== drag.current.pointerId) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const btn = el?.closest('button')
    if (btn?.hasAttribute('disabled')) return
    const d = dayFrom(el)
    if (d) apply(d)
  }

  const end = () => {
    drag.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-md font-semibold">{format(month, 'MMMM yyyy')}</div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!isBefore(today, startOfMonth(month))}
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="press grid size-8 place-items-center rounded-[10px] text-fg-2 hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="press grid size-8 place-items-center rounded-[10px] text-fg-2 hover:bg-black/5"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="pb-2">
            {d}
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        role="group"
        aria-label="Pick days. Click or drag across days."
        className={cn('grid grid-cols-7 gap-y-1 [touch-action:none] select-none', shake && 'animate-shake')}
        onAnimationEnd={() => setShake(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {weeks.map((d) => {
          const key = iso(d)
          const inMonth = isSameMonth(d, month)
          const past = isBefore(d, today)
          const on = selected.has(key)
          const prevOn = selected.has(iso(addDays(d, -1))) && d.getDay() !== 1
          const nextOn = selected.has(iso(addDays(d, 1))) && d.getDay() !== 0
          const isToday = key === iso(today)
          return (
            <button
              key={key}
              type="button"
              data-iso={key}
              disabled={past}
              aria-pressed={on}
              aria-label={format(d, 'EEEE, MMMM d')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  const next = new Set(selected)
                  if (on) next.delete(key)
                  else next.add(key)
                  commit(next)
                }
              }}
              className={cn(
                'relative h-10 text-base font-medium tnum transition-[background-color,color,border-radius] duration-150',
                on
                  ? cn('bg-ink text-white', prevOn ? 'rounded-l-[4px]' : 'rounded-l-[12px]', nextOn ? 'rounded-r-[4px]' : 'rounded-r-[12px]')
                  : 'rounded-[12px] hover:bg-black/[0.05]',
                !inMonth && !on && 'text-fg-4',
                past && 'cursor-not-allowed text-fg-4/60 line-through decoration-fg-4/50 hover:bg-transparent',
              )}
            >
              {format(d, 'd')}
              {isToday && (
                <span className={cn('absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full', on ? 'bg-pref' : 'bg-accent')} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
