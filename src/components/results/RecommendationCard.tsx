import { ArrowRight, Check, ChevronDown, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { optionHeadline, reasonFor } from '../../lib/explain'
import type { RankResult, Recommendation } from '../../lib/rank'
import { formatTime, slotStartMin, windowLabel } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { Avatar, prefToStatus } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { AttendanceRing } from './AttendanceRing'
import { RankLadder } from './RankLadder'

export function RecommendationCard({
  poll,
  result,
  index,
  onChoose,
  onHover,
  active,
}: {
  poll: Poll
  result: RankResult
  index: number
  onChoose?: (rec: Recommendation) => void
  onHover?: (rec: Recommendation | null) => void
  active?: boolean
}) {
  const rec = result.options[index]
  const [open, setOpen] = useState(false)
  const label = windowLabel(poll, rec.day, rec.startSlot, poll.duration)
  const reason = reasonFor(poll, result, index)
  const total = result.responded
  const top = index === 0
  const cant = rec.people.filter((p) => p.state === 0).length
  // #1 compares with #2 below it; everyone else with the option above
  const otherIndex = top ? 1 : index - 1
  const other = result.options[otherIndex]
  const otherLabel = other ? windowLabel(poll, other.day, other.startSlot, poll.duration) : null

  return (
    <motion.article
      // shared with ConfirmedTicket so confirming morphs the card into the ticket (organizer only)
      layoutId={onChoose ? `window-${rec.key}` : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1], delay: index * 0.045 }}
      onPointerEnter={() => onHover?.(rec)}
      onPointerLeave={() => onHover?.(null)}
      onFocusCapture={() => onHover?.(rec)}
      onBlurCapture={() => onHover?.(null)}
      aria-label={`Option ${rec.rank}: ${label.long}, ${label.range}`}
      className={cn(
        'card relative overflow-hidden p-4 transition-shadow duration-200 sm:p-5',
        active && 'shadow-raised',
      )}
    >
      {top && !rec.tied && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(90%_100%_at_15%_0%,color-mix(in_oklch,var(--color-pref)_22%,transparent),transparent_70%)]"
        />
      )}

      {/* ── identity: rank, when, how many ─────────────────────── */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex h-5 items-center gap-2">
            <span
              className={cn(
                'grid size-5 place-items-center rounded-full text-2xs font-semibold tnum',
                top ? 'bg-ink text-white' : 'bg-surface text-fg shadow-[0_0_0_1px_var(--color-line-strong)]',
              )}
            >
              <span className="glyph">{rec.rank}</span>
            </span>
            <span className="text-xs font-semibold text-fg-2">{optionHeadline(rec, result)}</span>
          </div>
          <div className="mt-3 text-sm text-fg-2">{label.long}</div>
          <div className={cn('mt-0.5 font-semibold tracking-[-0.02em] tnum', top ? 'text-xl' : 'text-lg')}>{label.range}</div>
        </div>
        <AttendanceRing value={rec.attendance} total={total} size={top ? 48 : 44} />
      </div>

      {/* ── why (reads like the description under a task title) ── */}
      <div className="relative mt-3">
        <p className="text-sm text-fg-2">
          <span className="font-semibold text-fg">{reason.title}:</span> {reason.body}
        </p>
        {rec.nearbyEqual && (
          <p className="mt-1 text-xs text-fg-3">
            {formatTime(slotStartMin(poll, rec.nearbyEqual.startSlot))} the same day scores exactly the same.
          </p>
        )}
      </div>

      <div className="dashed-divider relative my-4" />

      {/* ── who: avatars lead, counts trail (as in the reference task card) ── */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* no overlap: the state rings (solid / dashed) must stay readable */}
        <div className="flex items-center gap-1">
          {rec.people.map((p) => (
            <Avatar
              key={p.responseId}
              name={p.name}
              size="sm"
              status={prefToStatus(p.state)}
              title={`${p.name}: ${p.state === 2 ? 'Preferred' : p.state === 1 ? 'Works' : 'Can’t make it'}`}
            />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Count tone="pref" icon={<Star fill="currentColor" size={10} />} n={rec.preferred} label="prefer" />
          <Count tone="works" icon={<Check strokeWidth={2.5} size={10} />} n={rec.works} label="works" />
          {cant > 0 && <Count tone="none" icon={<X strokeWidth={2.5} size={10} />} n={cant} label="can’t make it" />}
        </div>
      </div>

      {/* ── actions ───────────────────────────────────────────── */}
      <div className="relative mt-4 flex items-center justify-between gap-3">
        {other ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="press -ms-2 inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2 text-sm font-medium text-fg-2 transition-colors hover:bg-black/[0.04] hover:text-fg"
          >
            Why this rank
            <ChevronDown size={12} strokeWidth={2.5} className={cn('transition-transform duration-200', open && 'rotate-180')} />
          </button>
        ) : (
          <span />
        )}
        {onChoose && (
          <Button size="sm" variant={top ? 'primary' : 'secondary'} className="pe-2.5" onClick={() => onChoose(rec)}>
            Choose this time <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && other && otherLabel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden"
          >
            <div className="pt-3">
              <RankLadder
                me={rec}
                other={other}
                myLabel={`#${rec.rank} ${label.weekday} ${label.time}`}
                otherLabel={`#${other.rank} ${otherLabel.weekday} ${otherLabel.time}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

function Count({ tone, icon, n, label }: { tone: 'pref' | 'works' | 'none'; icon: ReactNode; n: number; label: string }) {
  return (
    <span
      role="img"
      aria-label={`${n} ${label}`}
      title={`${n} ${label}`}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface ps-1 pe-2.5 text-xs font-semibold text-fg-2 shadow-[0_0_0_1px_var(--color-line-strong)] tnum"
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full',
          tone === 'pref' && 'bg-pref text-pref-ink',
          tone === 'works' && 'hatch text-works-ink',
          tone === 'none' && 'bg-black/[0.07] text-fg-3',
        )}
      >
        {icon}
      </span>
      {n}
    </span>
  )
}
