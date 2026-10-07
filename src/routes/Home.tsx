import { ArrowRight, Star } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AppShell } from '../components/AppShell'
import { Bento, DecisionVisual, LadderVisual, PaintVisual } from '../components/home/BentoCards'
import { Avatar, prefToStatus } from '../components/ui/Avatar'
import { buttonStyles } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { useMediaQuery } from '../lib/hooks'

export function Home() {
  return (
    <AppShell
      wide
      right={
        <span className="hidden sm:block">
          <Link to="/meetings" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
            Your meetings
          </Link>
        </span>
      }
    >
      {/* hero */}
      <section className="grid items-center gap-10 pt-4 pb-10 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-14 lg:pt-10 lg:pb-16">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pe-3 ps-1 text-sm text-fg-2 shadow-button"
          >
            <span className="rounded-full bg-pref px-2 py-0.5 text-2xs font-semibold text-pref-ink">New</span>
            Group scheduling that actually decides
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
            className="mt-5 text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-[56px]"
          >
            Find the <span className="relative whitespace-nowrap">
              <span className="relative z-10">best</span>
              <span aria-hidden className="absolute inset-x-[-4px] bottom-[6px] -z-0 h-[0.32em] rounded-[4px] bg-pref/70" />
            </span>{' '}
            shared time, not just the overlapping one.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
            className="mt-5 max-w-[46ch] text-md text-fg-2"
          >
            Everyone marks times as <strong className="font-semibold text-fg">Preferred</strong> or just{' '}
            <strong className="font-semibold text-fg">Works</strong>. CommonTime ranks the options, shows you exactly why, and ends with
            a confirmed time — no group-chat tiebreakers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/new" className={cn(buttonStyles({ variant: 'primary', size: 'lg' }), 'pe-[18px]')}>
              Create a poll <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/meetings" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Open the demo dashboard
            </Link>
          </motion.div>
          <p className="mt-5 text-sm text-fg-3">No accounts · Under a minute to respond · Built for groups of 3–10</p>
        </div>

        <HeroArtifact />
      </section>

      {/* bento */}
      <section className="grid gap-4 pb-8 md:grid-cols-3">
        <Bento
          title="Preferred isn’t the same as free"
          body="Two states, one tap apart. People can say “I can make it” without pretending it’s their favorite."
        >
          <PaintVisual />
        </Bento>
        <Bento title="Picks you can explain" body="Attendance first, then preference, then fairness. Every rank shows the step that decided it.">
          <LadderVisual />
        </Bento>
        <Bento title="Ends with a decision" body="The organizer confirms one time. Everyone who opens the link sees it first — with a calendar button.">
          <DecisionVisual />
        </Bento>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-6 text-sm text-fg-3">
        <span>CommonTime — a concept prototype for AI-Augmented Designer.</span>
        <span>Demo data lives in your browser only.</span>
      </footer>
    </AppShell>
  )
}

// ── hero artifact ─────────────────────────────────────────────────────────────

const HERO_OPTIONS = [
  { rank: 1, day: 'Tuesday', time: '7:00 – 8:00 PM', attend: '5/5', pref: 4, states: [2, 2, 2, 1, 2] as const },
  { rank: 2, day: 'Wednesday', time: '6:00 – 7:00 PM', attend: '5/5', pref: 2, states: [1, 2, 1, 2, 1] as const },
  { rank: 3, day: 'Thursday', time: '4:00 – 5:00 PM', attend: '4/5', pref: 3, states: [2, 2, 2, 0, 1] as const },
]
const HERO_PEOPLE = ['Maya', 'Ethan', 'Priya', 'Jordan', 'Sam']

function HeroArtifact() {
  const reduce = useReducedMotion()
  const [spread, setSpread] = useState(false)
  const [hot, setHot] = useState<number | null>(null)
  const [entered, setEntered] = useState(false)
  // a believable little heat pattern: evenings warm up
  const heat = useMemo(
    () =>
      Array.from({ length: 5 }, (_, d) =>
        Array.from({ length: 10 }, (_, r) => {
          const evening = r >= 6 ? 0.45 : 0
          const noise = ((d * 7 + r * 13) % 10) / 22
          const v = Math.min(1, evening + noise + (d === 1 && r >= 7 && r <= 8 ? 0.6 : 0))
          return v < 0.18 ? 0 : v
        }),
      ),
    [],
  )
  const wide = useMediaQuery('(min-width: 640px)')
  const k = wide ? 1 : 0.45
  const fan = spread
    ? [
        { x: -150 * k, y: 26, r: -9 },
        { x: 0, y: 0, r: 0 },
        { x: 150 * k, y: 26, r: 9 },
      ]
    : [
        { x: -96 * k, y: 18, r: -7 },
        { x: 0, y: 0, r: 0 },
        { x: 96 * k, y: 18, r: 7 },
      ]
  // render order: #2 left, #1 centre (top), #3 right
  const order = [1, 0, 2]

  return (
    <div
      className="relative mx-auto h-[420px] w-full max-w-[560px] select-none sm:h-[460px]"
      onPointerEnter={() => setSpread(true)}
      onPointerLeave={() => setSpread(false)}
      aria-hidden
    >
      {/* heatmap card behind */}
      <motion.div
        initial={{ opacity: 0, y: 16, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="card absolute top-0 left-1/2 w-[86%] -translate-x-1/2 p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">Group availability</span>
          <span className="flex">
            {HERO_PEOPLE.map((n, i) => (
              <Avatar key={n} name={n} size="xs" className={cn(i > 0 && '-ms-1.5')} />
            ))}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {heat.map((col, d) => (
            <div key={d} className="flex flex-col gap-1">
              <div className="pb-0.5 text-center text-[10px] font-semibold text-fg-3 uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d]}</div>
              {col.map((v, r) => (
                <motion.div
                  key={r}
                  initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + (d * 10 + r) * 0.012, ease: [0.23, 1, 0.32, 1] }}
                  className="h-[14px] rounded-[4px] shadow-[inset_0_0_0_1px_var(--color-line)]"
                  style={{
                    background: v === 0 ? 'white' : `color-mix(in oklch, var(--color-pref${v >= 1 ? '-strong' : ''}) ${Math.round(15 + v * 75)}%, white)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* fanned option cards — the whole fan spreads on hover, and the card under the
          pointer rises out of it, straightens and comes to the front */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center">
        {order.map((i, z) => {
          const o = HERO_OPTIONS[i]
          const f = fan[z]
          const lifted = hot === o.rank
          return (
            <motion.div
              key={o.rank}
              initial={reduce ? false : { opacity: 0, y: 60, rotate: 0 }}
              animate={{ opacity: 1, x: f.x, y: lifted ? f.y - 18 : f.y, rotate: lifted ? f.r * 0.35 : f.r }}
              // the entrance delay must only apply once — otherwise every hover waits ~0.7s
              transition={{ type: 'spring', duration: entered ? 0.45 : 0.6, bounce: 0.18, delay: entered || reduce ? 0 : 0.7 + z * 0.06 }}
              onAnimationComplete={() => z === order.length - 1 && setEntered(true)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(o.rank)}
              onPointerLeave={() => setHot(null)}
              className={cn(
                'card absolute bottom-0 left-1/2 -ms-[115px] w-[230px] origin-bottom p-4 transition-shadow duration-200',
                lifted ? 'z-30 shadow-pop' : o.rank === 1 ? 'z-20 shadow-pop' : 'z-10',
              )}
            >
              {o.rank === 1 && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-[20px] bg-[radial-gradient(90%_100%_at_20%_0%,color-mix(in_oklch,var(--color-pref)_25%,transparent),transparent_70%)]" />
              )}
              <div className="relative flex items-center gap-1.5">
                <span
                  className={cn(
                    'grid size-[18px] place-items-center rounded-full text-[10px] font-semibold tnum',
                    o.rank === 1 ? 'bg-ink text-white' : 'bg-surface shadow-[0_0_0_1px_var(--color-line-strong)]',
                  )}
                >
                  <span className="glyph">{o.rank}</span>
                </span>
                <span className="text-xs font-semibold text-fg-2">{o.rank === 1 ? 'Best time' : 'Alternative'}</span>
                <span className="ms-auto text-xs font-semibold tnum">{o.attend}</span>
              </div>
              <div className="relative mt-2 text-xs text-fg-3">{o.day}</div>
              <div className="relative text-md font-semibold tracking-[-0.01em] tnum">{o.time}</div>
              <div className="relative mt-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-fg-2">
                  <span className="grid size-4 place-items-center rounded-full bg-pref text-pref-ink">
                    <Star size={9} fill="currentColor" />
                  </span>
                  {o.pref} prefer
                </span>
                <span className="flex">
                  {HERO_PEOPLE.map((n, k) => (
                    <Avatar key={n} name={n} size="xs" status={prefToStatus(o.states[k])} className={cn(k > 0 && '-ms-1')} />
                  ))}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* decorative brush chip, like the painter's cursor */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, y: spread ? -4 : 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: entered || reduce ? 0 : 1.1 }}
        className="absolute top-[38%] right-[4%] z-30 flex items-center gap-1.5 rounded-full bg-ink/92 py-1 pe-2.5 ps-1 text-xs font-medium text-white shadow-raised"
      >
        <span className="grid size-[18px] place-items-center rounded-full bg-pref text-pref-ink">
          <Star size={10} fill="currentColor" />
        </span>
        Tue · 7:00 – 9:00 PM
      </motion.div>
    </div>
  )
}

