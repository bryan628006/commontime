import { Menu } from '@base-ui/react/menu'
import { CalendarPlus, Check, ChevronDown, Download, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion, useMotionTemplate, useReducedMotion, useSpring } from 'motion/react'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import { useFinePointer } from '../../lib/hooks'
import { listNames } from '../../lib/explain'
import { downloadIcs, googleCalendarUrl } from '../../lib/ics'
import { scoreWindow } from '../../lib/rank'
import { formatDuration, windowLabel } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { Avatar, prefToStatus } from '../ui/Avatar'
import { buttonStyles } from '../ui/Button'
import { Celebration } from './Celebration'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
/** CSS `ease` — for hover/opacity changes */
const EASE = [0.25, 0.1, 0.25, 1] as const

/**
 * PRD Feature 4 — the confirmed state. Deliberately a different *shape* (a ticket with an ink
 * header) so it's distinguishable from the results state without relying on animation.
 */
export function ConfirmedTicket({
  poll,
  shareUrl,
  celebrate,
  pendingNames = [],
  calendarVariant = 'primary',
  children,
}: {
  poll: Poll
  shareUrl: string
  celebrate?: boolean
  pendingNames?: string[]
  /** organizer's primary action lives elsewhere (announce), so it can demote this */
  calendarVariant?: 'primary' | 'secondary'
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const c = poll.confirmed!
  const label = windowLabel(poll, c.day, c.startSlot, poll.duration)
  const score = scoreWindow(poll, c.day, c.startSlot)
  const total = poll.responses.length
  const cant = score.people.filter((p) => p.state === 0).map((p) => p.name)

  // ── hover: light moves, data doesn't ───────────────────────────────────────
  // A soft glare follows the pointer across the ink face (decorative mouse-tracking →
  // spring-smoothed), the stamp straightens toward you and its halo brightens, and the
  // ticket lifts 3px. The date, time and buttons never move relative to each other.
  const track = fine && !reduce
  const inkRef = useRef<HTMLDivElement>(null)
  const gx = useSpring(0, { stiffness: 260, damping: 30, mass: 0.6 })
  const gy = useSpring(0, { stiffness: 260, damping: 30, mass: 0.6 })
  const glare = useMotionTemplate`translate3d(${gx}px, ${gy}px, 0)`
  const pointAt = (e: PointerEvent, jump = false) => {
    const r = inkRef.current?.getBoundingClientRect()
    if (!r) return
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (jump) {
      gx.jump(x)
      gy.jump(y)
    } else {
      gx.set(x)
      gy.set(y)
    }
  }

  return (
    <motion.section
      layoutId={`window-${c.day}:${c.startSlot}`}
      aria-label={`Confirmed: ${poll.name}, ${label.long}, ${label.range}`}
      className="relative [filter:drop-shadow(0_1px_1px_rgb(0_0_0/0.06))_drop-shadow(0_14px_28px_rgb(0_0_0/0.12))]"
      transition={{ type: 'spring', duration: 0.6, bounce: 0.12 }}
    >
      {/* hover lives on an inner wrapper so it never fights the layoutId morph above */}
      <motion.div
        className="relative isolate"
        initial="rest"
        animate="rest"
        // reduced motion: the ticket stays put (no lift, no stamp turn)
        whileHover={reduce ? undefined : 'hover'}
        variants={{ rest: { transform: 'translateY(0px)' }, hover: { transform: 'translateY(-3px)' } }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        onPointerEnter={(e) => track && e.pointerType === 'mouse' && pointAt(e, true)}
        onPointerMove={(e) => track && e.pointerType === 'mouse' && pointAt(e)}
      >
      {/* deeper shadow fades in under the lifted ticket */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-12 bottom-0 -z-10 rounded-[24px] shadow-[0_28px_48px_-18px_rgb(0_0_0/0.35)]"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: 0.25, ease: EASE }}
      />
      <div className="overflow-hidden rounded-[24px]">
        {/* ink stub */}
        <div ref={inkRef} className="notch-bottom relative overflow-hidden bg-ink px-5 pt-5 pb-6 text-white sm:px-6 sm:pt-6">
          {track && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 -ms-[220px] -mt-[220px] size-[440px] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.13),rgb(255_255_255/0.045)_45%,transparent)]"
              style={{ transform: glare }}
              variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
              transition={{ duration: 0.3, ease: EASE }}
            />
          )}
          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pe-2.5 ps-1 text-2xs font-semibold tracking-[0.08em] text-white uppercase shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
              <span className="grid size-4 place-items-center rounded-full bg-pref text-pref-ink">
                <Check size={10} strokeWidth={2.5} />
              </span>
              Confirmed
            </span>
            <span className="truncate text-sm text-white/60">{poll.name}</span>
          </div>

          <div className="relative mt-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-white/60">{label.weekdayLong}</div>
              <div className="text-2xl font-semibold tracking-[-0.03em]">
                {label.month} {label.dayNum}
              </div>
              <div className="mt-1 text-lg font-medium text-white/90 tnum">
                {label.range} <span className="text-white/45">· {formatDuration(poll.duration)}</span>
              </div>
            </div>
            <div className="relative shrink-0">
              {/* the stamp is the light source: glow is centred on it (the ink stub clips it),
                  switches on as the stamp lands, and brightens on hover */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 size-[280px] -translate-x-1/2 -translate-y-1/2"
                variants={{
                  rest: { opacity: 0.85, transform: 'scale(1)' },
                  hover: { opacity: 1, transform: 'scale(1.12)' },
                }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                <motion.div
                  initial={celebrate && !reduce ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
                  className="size-full rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-pref)_42%,transparent),color-mix(in_oklch,var(--color-pref)_12%,transparent)_55%,transparent)]"
                />
              </motion.div>
              {/* burst sits outside the stamp so it isn't faded by the stamp's own entrance */}
              {celebrate && <Celebration delay={0.32} />}
              {/* hover: the stamp turns toward you (−8° → −3°) and rises a touch */}
              <motion.div
                className="relative z-10"
                variants={{
                  rest: { transform: 'rotate(0deg) scale(1)' },
                  hover: { transform: 'rotate(5deg) scale(1.05)' },
                }}
                transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
              >
              <motion.div
                initial={celebrate && !reduce ? { scale: 1.6, rotate: -24, opacity: 0 } : false}
                animate={{ scale: 1, rotate: -8, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.55, bounce: 0.35, delay: 0.25 }}
                // contact shadow only — the ambient glow now comes from the centred halo behind
                className="relative z-10 grid size-[76px] place-items-center rounded-[22px] bg-pref text-pref-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_6px_14px_-6px_rgb(0_0_0/0.5)]"
              >
                <Check size={38} strokeWidth={2.5} />
              </motion.div>
              </motion.div>
            </div>
          </div>
          {/* perforation */}
          <div aria-hidden className="absolute inset-x-5 bottom-0 border-t-[1.5px] border-dashed border-white/20" />
        </div>

        {/* details */}
        <div className="notch-top bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex items-center gap-1">
              {score.people.map((p) => (
                <Avatar key={p.responseId} name={p.name} size="md" status={prefToStatus(p.state)} title={p.name} />
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold tnum">
                {score.attendance} of {total} can attend
              </div>
              <div className="text-fg-3">
                {cant.length ? `${listNames(cant)} can’t make it` : 'Everyone who responded can make it'}
                {pendingNames.length > 0 && ` · ${listNames(pendingNames)} didn’t respond`}
              </div>
            </div>
          </div>

          <div className="dashed-divider my-5" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-fg-2">
              <Avatar name={poll.organizerName} size="xs" />
              Confirmed by <span className="font-medium text-fg">{poll.organizerName}</span>
              <span className="text-fg-4">· {formatDistanceToNow(c.at, { addSuffix: true })}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {children}
              <AddToCalendar poll={poll} shareUrl={shareUrl} variant={calendarVariant} />
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </motion.section>
  )
}

function AddToCalendar({ poll, shareUrl, variant }: { poll: Poll; shareUrl: string; variant: 'primary' | 'secondary' }) {
  // concentric: popup 14px = item 10px + 4px padding
  const item =
    'flex h-9 cursor-default items-center gap-2.5 rounded-[10px] px-2.5 text-sm outline-none select-none data-highlighted:bg-black/[0.05]'
  return (
    <Menu.Root>
      <Menu.Trigger className={buttonStyles({ variant, size: 'md' })}>
        <CalendarPlus size={16} strokeWidth={2.5} /> Add to calendar <ChevronDown size={12} strokeWidth={2.5} className="opacity-60" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="origin-[var(--transform-origin)] rounded-[14px] bg-surface p-1 shadow-pop outline-none transition-[scale,opacity] duration-150 ease-[var(--ease-out)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <Menu.Item className={item} onClick={() => downloadIcs(poll, shareUrl)}>
              <Download size={16} /> Download .ics
              <span className="ms-auto ps-4 text-2xs text-fg-4">Apple, Outlook</span>
            </Menu.Item>
            <Menu.Item className={item} onClick={() => window.open(googleCalendarUrl(poll, shareUrl), '_blank', 'noopener')}>
              <ExternalLink size={16} /> Google Calendar
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
