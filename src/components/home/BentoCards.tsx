import { Check, CircleCheck, Equal, Minus, Scale, Star, Users } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { Avatar } from '../ui/Avatar'
import { cn } from '../ui/cn'

/*
 * Home-page bento cards. Marketing surface, seen rarely → each card is allowed a short
 * *explanatory* hover that acts out its own claim. All motion is driven by Motion variants
 * propagated from the card's `whileHover`, so it is:
 *   · interruptible (leave mid-way and it settles from where it is),
 *   · mouse/pen only (Motion ignores touch "hover"),
 *   · reduced-motion aware (MotionConfig reducedMotion="user" drops transforms; opacity stays).
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export function Bento({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial="rest"
      animate="rest"
      // reduced motion: no choreography and no lift — the shadow change remains as the static cue
      whileHover={reduce ? undefined : 'hover'}
      variants={{ rest: { transform: 'translateY(0px)' }, hover: { transform: 'translateY(-3px)' } }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      // visuals differ in height: centre each in a flexible area so the titles share one baseline
      className="card flex flex-col p-5 transition-shadow duration-200 ease-out hover:shadow-raised"
    >
      <div className="flex min-h-[184px] flex-1 flex-col justify-center pb-6">{children}</div>
      <h3 className="text-md font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-fg-2">{body}</p>
    </motion.article>
  )
}

// ── 1 · Preferred isn't the same as free — the swatches paint themselves in ────────────

const ROWS = [
  { kind: 'pref', label: 'Preferred', sub: 'I’d pick this' },
  { kind: 'works', label: 'Works', sub: 'I can make it' },
  { kind: 'none', label: 'Unavailable', sub: 'Left blank' },
] as const

export function PaintVisual() {
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((r, i) => {
        const fill: Variants = {
          rest: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.15 } },
          // wipe left → right like a brush stroke, one row after another
          hover: {
            clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
            transition: { duration: 0.42, ease: EASE_OUT, delay: 0.05 + i * 0.09 },
          },
        }
        const icon: Variants = {
          rest: { opacity: 1, transform: 'scale(1)', transition: { duration: 0.15 } },
          hover: {
            opacity: [0, 1],
            transform: ['scale(0.6)', 'scale(1)'],
            transition: { duration: 0.28, ease: EASE_OUT, delay: 0.3 + i * 0.09 },
          },
        }
        return (
          // concentric: row 12px = swatch 6px + 6px padding
          <div key={r.kind} className="flex items-center gap-2.5 rounded-[12px] bg-sunken p-1.5 pe-3">
            <span className="relative grid h-7 w-10 place-items-center overflow-hidden rounded-[6px] bg-surface shadow-[inset_0_0_0_1px_var(--color-line-strong)]">
              {r.kind !== 'none' && (
                <motion.span
                  aria-hidden
                  variants={fill}
                  className={cn(
                    'absolute inset-0 rounded-[6px]',
                    r.kind === 'pref' && 'bg-pref shadow-[inset_0_0_0_1px_var(--color-pref-strong)]',
                    r.kind === 'works' && 'hatch shadow-[inset_0_0_0_1px_var(--color-works-line)]',
                  )}
                />
              )}
              {r.kind !== 'none' && (
                <motion.span variants={icon} className={cn('relative', r.kind === 'pref' ? 'text-pref-ink' : 'text-works-ink')}>
                  {r.kind === 'pref' ? <Star size={12} fill="currentColor" /> : <Check size={12} strokeWidth={2.5} />}
                </motion.span>
              )}
            </span>
            <span className="text-sm font-medium">{r.label}</span>
            <span className="ms-auto text-xs text-fg-3">{r.sub}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 2 · Picks you can explain — a highlight walks the ladder and stops where it's decided ─

const STEPS = [
  { icon: <Users size={12} strokeWidth={2.5} />, label: 'Attendance', a: '6', b: '6', state: 'same' },
  { icon: <Star size={12} strokeWidth={2.5} />, label: 'Preference', a: '10 pts', b: '8 pts', state: 'decided' },
  { icon: <Scale size={12} strokeWidth={2.5} />, label: 'Fairness', a: '—', b: '—', state: 'unused' },
] as const

const ROW = 38 // h-9 (36) + gap-0.5 (2)

export function LadderVisual() {
  return (
    // concentric: panel 14px = row 8px + 6px padding
    <div className="relative flex flex-col gap-0.5 rounded-[14px] bg-sunken p-1.5">
      {/* the "cursor" of the ranking: rests on the deciding step; on hover it checks
          step 1 (a tie), then moves on to step 2 where it's decided */}
      <motion.div
        aria-hidden
        className="absolute inset-x-1.5 top-1.5 h-9 rounded-[8px] bg-surface shadow-[0_0_0_1px_var(--color-line),0_1px_2px_rgb(0_0_0/0.05)]"
        variants={{
          rest: { transform: `translateY(${ROW}px)`, transition: { duration: 0.25, ease: EASE_OUT } },
          hover: {
            transform: [`translateY(${ROW}px)`, 'translateY(0px)', 'translateY(0px)', `translateY(${ROW}px)`],
            transition: { duration: 1.2, times: [0, 0.25, 0.55, 1], ease: EASE_IN_OUT },
          },
        }}
      />
      {STEPS.map((s) => (
        <div key={s.label} className={cn('relative flex h-9 items-center gap-2 rounded-[8px] px-2 text-sm', s.state === 'unused' && 'opacity-45')}>
          <span
            className={cn(
              'grid size-5 place-items-center rounded-full',
              s.state === 'decided' ? 'bg-ink text-white' : 'bg-black/[0.06] text-fg-2',
            )}
          >
            {s.icon}
          </span>
          <span className="flex-1">{s.label}</span>
          <span className="text-xs font-semibold tnum">{s.a}</span>
          <span className="text-2xs text-fg-4">vs</span>
          <span className="text-xs text-fg-3 tnum">{s.b}</span>
          <span className="grid w-[13px] place-items-center">
            {s.state === 'same' && <Equal size={12} className="text-fg-3" />}
            {s.state === 'unused' && <Minus size={12} className="text-fg-4" />}
            {s.state === 'decided' && (
              <motion.span
                className="grid"
                variants={{
                  rest: { opacity: 1, transform: 'scale(1)', transition: { duration: 0.15 } },
                  // the verdict appears only once the highlight has landed
                  hover: {
                    opacity: [0, 0, 1],
                    transform: ['scale(0.6)', 'scale(0.6)', 'scale(1)'],
                    transition: { duration: 1.3, times: [0, 0.82, 1], ease: EASE_OUT },
                  },
                }}
              >
                <CircleCheck size={13} fill="currentColor" stroke="white" strokeWidth={2.5} className="text-pref-strong" />
              </motion.span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── 3 · Ends with a decision — the stamp lifts and presses down ────────────────────────

const TEAM = ['Maya', 'Ethan', 'Priya', 'Jordan']

export function DecisionVisual() {
  return (
    <motion.div
      className="overflow-hidden rounded-[14px]"
      variants={{ rest: { transform: 'rotate(0deg)' }, hover: { transform: 'rotate(-1.5deg)' } }}
      transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
    >
      <div className="notch-bottom relative flex items-center justify-between overflow-hidden bg-ink px-4 py-3 text-white">
        <div className="relative z-10">
          <div className="text-2xs font-semibold tracking-[0.08em] text-white/55 uppercase">Confirmed</div>
          <div className="text-md font-semibold">Tue, Oct 13 · 7 PM</div>
        </div>
        <span className="relative grid size-8 place-items-center">
          {/* light switches on as the stamp lands */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-pref)_40%,transparent),transparent)]"
            variants={{
              rest: { opacity: 0, transition: { duration: 0.2 } },
              hover: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT, delay: 0.22 } },
            }}
          />
          {/* impact ring */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[10px] ring-2 ring-pref"
            variants={{
              rest: { opacity: 0, transform: 'scale(1)', transition: { duration: 0 } },
              hover: {
                opacity: [0, 0.7, 0],
                transform: ['scale(0.9)', 'scale(0.9)', 'scale(1.7)'],
                transition: { duration: 0.6, times: [0, 0.35, 1], ease: EASE_OUT, delay: 0.18 },
              },
            }}
          />
          {/* lift high and tilted, then press down square */}
          <motion.span
            className="relative grid size-8 place-items-center rounded-[10px] bg-pref text-pref-ink"
            variants={{
              rest: { transform: 'rotate(-6deg) scale(1)', transition: { type: 'spring', duration: 0.4, bounce: 0.2 } },
              hover: {
                transform: ['rotate(-6deg) scale(1)', 'rotate(-16deg) scale(1.3)', 'rotate(0deg) scale(1)'],
                transition: { duration: 0.5, times: [0, 0.4, 1], ease: EASE_OUT },
              },
            }}
          >
            <Check size={16} strokeWidth={2.5} />
          </motion.span>
        </span>
      </div>
      <div className="notch-top flex h-10 items-center gap-2 bg-sunken px-4 text-xs text-fg-2">
        <div className="flex">
          {TEAM.map((n, i) => (
            // the group gathers: avatars fan out a touch when the time is set
            <motion.span
              key={n}
              className={cn('inline-flex', i > 0 && '-ms-1.5')}
              // delay only on the way in — leaving settles immediately (exits faster than entrances)
              variants={{
                rest: { transform: 'translateX(0px)', transition: { type: 'spring', duration: 0.3, bounce: 0 } },
                hover: {
                  transform: `translateX(${i * 3}px)`,
                  transition: { type: 'spring', duration: 0.45, bounce: 0.2, delay: 0.25 + i * 0.03 },
                },
              }}
            >
              <Avatar name={n} size="xs" />
            </motion.span>
          ))}
        </div>
        <span className="ms-3">6 of 6 can attend</span>
      </div>
    </motion.div>
  )
}
