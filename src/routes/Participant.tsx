import NumberFlow from '@number-flow/react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, LoaderCircle, Lock, LogOut, Pencil, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { AppShell } from '../components/AppShell'
import { AvailabilityPainter } from '../components/grid/AvailabilityPainter'
import { BrushDock } from '../components/grid/BrushDock'
import { countCells } from '../components/grid/cellRuns'
import { usePaintState, type Brush } from '../components/grid/usePaintState'
import { ConfirmedTicket } from '../components/results/ConfirmedTicket'
import { EventHeader } from '../components/results/EventHeader'
import { ResultsPanel } from '../components/results/ResultsPanel'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { MorphLabel } from '../components/ui/MorphLabel'
import { isTypingTarget, useIsDesktop } from '../lib/hooks'
import { participantUrl } from '../lib/links'
import { hashPin } from '../lib/pin'
import { rankPoll } from '../lib/rank'
import { cellKey, dayParts, slotsPerDay } from '../lib/time'
import type { Cells, Poll, PollResponse } from '../lib/types'
import { usePoll, usePolls } from '../store/polls'
import { useIdentity, useSession, type Identity } from '../store/session'
import { NotFound } from './NotFound'

export function Participant() {
  const { id } = useParams()
  const poll = usePoll(id)
  const identity = useIdentity(id)
  if (!poll) return <NotFound />
  // remount everything when the demo dock switches who "you" are
  return <ParticipantInner key={`${poll.id}:${identity?.name ?? ''}`} poll={poll} identity={identity} />
}

function findMine(poll: Poll, identity?: Identity) {
  if (!identity) return undefined
  return (
    poll.responses.find((r) => r.id === identity.responseId) ??
    poll.responses.find((r) => r.name.trim().toLowerCase() === identity.name.trim().toLowerCase())
  )
}

function ParticipantInner({ poll, identity }: { poll: Poll; identity?: Identity }) {
  const mine = findMine(poll, identity)
  const [editing, setEditing] = useState(!mine)
  const result = useMemo(() => rankPoll(poll), [poll])

  let body
  if (!identity) {
    body = <IdentityStep poll={poll} />
  } else if (editing || !mine) {
    body = (
      <PaintStep
        poll={poll}
        identity={identity}
        existing={mine}
        onDone={() => setEditing(false)}
        onCancel={mine ? () => setEditing(false) : undefined}
      />
    )
  } else {
    body = (
      // page sections 32px apart; cards within a section 16px apart
      <div className="flex flex-col gap-8">
        {poll.status === 'confirmed' && poll.confirmed ? (
          <ConfirmedTicket poll={poll} shareUrl={participantUrl(poll)} pendingNames={result.pendingNames}>
            <Button variant="secondary" className="ps-3.5" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit my response
            </Button>
          </ConfirmedTicket>
        ) : (
          <div className="flex flex-col gap-4">
            <EventHeader poll={poll} />
            <YoureIn poll={poll} mine={mine} onEdit={() => setEditing(true)} />
          </div>
        )}
        <ResultsPanel
          poll={poll}
          result={result}
          readOnlyNote={
            poll.status === 'confirmed'
              ? undefined
              : `${poll.organizerName} picks the final time — these are a starting point, not a decision.`
          }
        />
      </div>
    )
  }

  return (
    <AppShell
      crumbs={[{ label: 'Meetings', to: '/meetings' }, { label: poll.name }]}
      right={identity ? <SignedInAs poll={poll} identity={identity} /> : undefined}
      wide
    >
      {body}
    </AppShell>
  )
}

// ── Step 1 — sign in (When2meet-style: name + optional password, only for this poll) ─

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

const fieldCls =
  'h-12 w-full rounded-[14px] bg-surface px-4 text-md shadow-[0_0_0_1px_var(--color-line-strong)] outline-none transition-shadow placeholder:text-fg-4 focus:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)]'

function IdentityStep({ poll }: { poll: Poll }) {
  const setIdentity = useSession((s) => s.setIdentity)
  const upsert = usePolls((s) => s.upsertResponse)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [preview, setPreview] = useState('')
  const pinRef = useRef<HTMLInputElement>(null)

  // avatar follows the name once typing pauses — no animation per keystroke
  useEffect(() => {
    const t = window.setTimeout(() => setPreview(name.trim()), 250)
    return () => window.clearTimeout(t)
  }, [name])

  const known = useMemo(() => {
    const m = new Map<string, PollResponse | undefined>()
    for (const n of poll.invitees ?? []) m.set(n, undefined)
    for (const r of poll.responses) {
      const inv = [...m.keys()].find((k) => sameName(k, r.name))
      m.set(inv ?? r.name, r)
    }
    return [...m.entries()]
  }, [poll])

  const match = name.trim() ? poll.responses.find((r) => sameName(r.name, name)) : undefined
  const locked = !!match?.pinHash

  const fail = (msg: string) => {
    setError(msg)
    setShake(true)
  }

  const signIn = async (raw: string, password: string) => {
    const n = raw.trim()
    if (!n) return
    const existing = poll.responses.find((r) => sameName(r.name, n))

    // a protected name needs its password
    if (existing?.pinHash) {
      if (!password) {
        setName(existing.name)
        setError(null)
        pinRef.current?.focus()
        return
      }
      if ((await hashPin(poll.id, existing.name, password)) !== existing.pinHash) {
        return fail(`That password doesn’t match ${existing.name}’s.`)
      }
      setIdentity(poll.id, { name: existing.name, responseId: existing.id })
      return
    }

    // new or unprotected name: a password is optional and protects the times from now on
    const pinHash = password ? await hashPin(poll.id, existing?.name ?? n, password) : undefined
    if (existing && pinHash) upsert(poll.id, { id: existing.id, name: existing.name, cells: existing.cells, pinHash })
    setIdentity(poll.id, { name: existing?.name ?? n, responseId: existing?.id, pinHash })
  }

  const helper = locked
    ? `${match!.name} protected their times with a password.`
    : match
      ? `Welcome back. ${match.name} has no password yet — add one to protect your times, or leave it blank.`
      : 'New here? Make up a password to stop others editing your times, or leave it blank.'

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4">
      <EventHeader poll={poll} />
      <section className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar name={preview || 'guest'} size="xl" />
          <div>
            <h2 className="text-lg font-semibold">Sign in to respond</h2>
            <p className="mt-0.5 text-sm text-fg-3">No account needed. Your name and password only work for this poll.</p>
          </div>
        </div>

        {known.length > 0 && (
          <>
            <div className="mt-5 text-xs font-medium text-fg-3">Tap your name</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {known.map(([n, r]) => (
                <button
                  key={n}
                  type="button"
                  // unprotected names sign in in one tap (fast path); protected ones ask for the password
                  onClick={() => (r?.pinHash ? signIn(n, '') : setIdentity(poll.id, { name: r?.name ?? n, responseId: r?.id }))}
                  className="press inline-flex h-10 items-center gap-2 rounded-full bg-surface ps-1.5 pe-3.5 text-base shadow-[0_0_0_1px_var(--color-line-strong)] transition-colors hover:bg-sunken"
                >
                  <Avatar name={n} size="sm" status={r ? undefined : 'pending'} />
                  {n}
                  {r?.pinHash ? (
                    <Lock size={12} className="text-fg-3" aria-label="password protected" />
                  ) : (
                    r && <span className="text-xs text-fg-3">edit</span>
                  )}
                </button>
              ))}
            </div>
            <div className="my-5 flex items-center gap-3 text-xs text-fg-3">
              <div className="dashed-divider flex-1" /> or sign in <div className="dashed-divider flex-1" />
            </div>
          </>
        )}

        <form
          noValidate
          className={cn('flex flex-col gap-4', known.length === 0 && 'mt-5', shake && 'animate-shake')}
          onAnimationEnd={() => setShake(false)}
          onSubmit={(e) => {
            e.preventDefault()
            signIn(name, pin)
          }}
        >
          <label className="block">
            <span className="mb-2 flex h-5 items-center text-sm font-medium text-fg-2">Your name</span>
            <input
              autoComplete="username"
              value={name}
              maxLength={40}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Ethan"
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 flex h-5 items-center gap-1.5 text-sm font-medium text-fg-2">
              Password
              <span className={cn('font-normal', locked ? 'text-fg-2' : 'text-fg-3')}>{locked ? 'Required' : 'Optional'}</span>
            </span>
            <input
              ref={pinRef}
              type="password"
              autoComplete={locked ? 'current-password' : 'new-password'}
              value={pin}
              maxLength={64}
              onChange={(e) => {
                setPin(e.target.value)
                setError(null)
              }}
              placeholder={locked ? `${match!.name}’s password` : 'Leave blank to skip'}
              aria-describedby="signin-help"
              aria-invalid={!!error}
              className={fieldCls}
            />
            <span id="signin-help" className={cn('mt-2 block text-xs', error ? 'text-danger' : 'text-fg-3')} role={error ? 'alert' : undefined}>
              {error ?? helper}
            </span>
          </label>
          <Button type="submit" variant="primary" size="lg" className="w-full pe-[18px]" disabled={!name.trim() || (locked && !pin)}>
            {locked ? <Lock size={15} strokeWidth={2.25} /> : null}
            Sign in <ArrowRight size={15} strokeWidth={2.5} />
          </Button>
        </form>
      </section>
    </div>
  )
}

/** Header control: who you're signed in as on this poll, and a way out ("Not Ethan?"). */
function SignedInAs({ poll, identity }: { poll: Poll; identity: Identity }) {
  const setIdentity = useSession((s) => s.setIdentity)
  return (
    <button
      type="button"
      onClick={() => setIdentity(poll.id, null)}
      aria-label={`Signed in as ${identity.name}. Sign out`}
      className="press inline-flex h-8 items-center gap-2 rounded-full bg-surface ps-1 pe-3 text-sm text-fg-2 shadow-button transition-colors hover:bg-sunken hover:text-fg"
    >
      <Avatar name={identity.name} size="xs" />
      <span className="hidden font-medium text-fg sm:inline">{identity.name}</span>
      <span aria-hidden className="hidden h-3.5 w-px bg-line-strong sm:block" />
      <LogOut size={14} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  )
}

// ── Step 2 — paint availability ──────────────────────────────────────────────

function PaintStep({
  poll,
  identity,
  existing,
  onDone,
  onCancel,
}: {
  poll: Poll
  identity: Identity
  existing?: PollResponse
  onDone: () => void
  onCancel?: () => void
}) {
  const paint = usePaintState(existing?.cells ?? {})
  const [brush, setBrush] = useState<Brush>(2)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const desktop = useIsDesktop()
  const [day, setDay] = useState(0)
  const [dir, setDir] = useState(1)
  const upsert = usePolls((s) => s.upsertResponse)
  const setIdentity = useSession((s) => s.setIdentity)
  const counts = countCells(paint.cells)
  const marked = counts.preferred + counts.works
  const slots = slotsPerDay(poll)
  const narrow = poll.dates.length <= 5 && slots <= 12
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // 1 / 2 / 3 switch brushes, ⌘/Ctrl+Z undoes the last stroke
  const undo = paint.undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '1') setBrush(2)
      else if (e.key === '2') setBrush(1)
      else if (e.key === '3') setBrush(0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const submit = () => {
    if (saving !== 'idle') return
    setSaving('saving')
    timers.current.push(
      window.setTimeout(() => {
        const r = upsert(poll.id, { id: existing?.id, name: identity.name, cells: paint.cells, pinHash: identity.pinHash })
        setIdentity(poll.id, { name: r.name, responseId: r.id })
        setSaving('saved')
        timers.current.push(
          window.setTimeout(() => {
            toast.success(existing ? 'Availability updated' : 'You’re in', {
              description: `${poll.organizerName} will confirm the final time.`,
            })
            onDone()
          }, 650),
        )
      }, 450),
    )
  }

  const markAllWorks = () => {
    const next: Cells = { ...paint.cells }
    poll.dates.forEach((_, d) => {
      for (let s = 0; s < slots; s++) if (!next[cellKey(d, s)]) next[cellKey(d, s)] = 1
    })
    paint.replace(next)
  }

  const goDay = (i: number) => {
    setDir(i > day ? 1 : -1)
    setDay(Math.max(0, Math.min(poll.dates.length - 1, i)))
  }

  const submitLabel =
    saving === 'saving' ? (
      <MorphLabel id="saving">
        <LoaderCircle size={16} strokeWidth={2.5} className="animate-spin" /> Saving
      </MorphLabel>
    ) : saving === 'saved' ? (
      <MorphLabel id="saved">
        <Check size={16} strokeWidth={2.5} /> Saved
      </MorphLabel>
    ) : (
      <MorphLabel id="idle">
        {marked === 0 ? 'I can’t make any of these' : existing ? 'Update availability' : 'Submit availability'}
        {marked > 0 && <ArrowRight size={15} strokeWidth={2.5} />}
      </MorphLabel>
    )

  const counter = (
    <div className="flex items-center gap-3 text-sm text-fg-2 tnum" aria-live="polite">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-pref shadow-[inset_0_0_0_1px_var(--color-pref-strong)]" />
        <NumberFlow value={counts.preferred / 2} /> h preferred
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="hatch size-2.5 rounded-[3px] shadow-[inset_0_0_0_1px_var(--color-works-line)]" />
        <NumberFlow value={counts.works / 2} /> h works
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <EventHeader poll={poll} className="hidden md:block" />

      <section className={cn('card', desktop ? 'p-5' : 'p-4')}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={identity.name} size="lg" />
            <div>
              <h1 className="text-lg font-semibold">
                {existing ? 'Edit your availability' : `When are you free, ${identity.name}?`}
              </h1>
              <p className="text-sm text-fg-3">
                <span className="font-medium text-fg-2">Preferred</span> = you&rsquo;d pick it.{' '}
                <span className="font-medium text-fg-2">Works</span> = you can make it.
              </p>
            </div>
          </div>
          {desktop && (
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button variant={marked === 0 ? 'secondary' : 'primary'} size="lg" onClick={submit} className="min-w-[200px]">
                {submitLabel}
              </Button>
            </div>
          )}
        </div>

        {desktop && (
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <BrushDock brush={brush} onBrush={setBrush} onUndo={paint.undo} canUndo={paint.canUndo} className="w-full max-w-[520px]" />
            {counter}
            {narrow && (
              <Button size="sm" variant="ghost" className="ms-auto" onClick={markAllWorks}>
                <Sparkles size={14} /> Mark all as Works
              </Button>
            )}
          </div>
        )}

        {!desktop && (
          <>
            <div className="mt-4">{counter}</div>
            <DayTabs poll={poll} cells={paint.cells} day={day} onDay={goDay} />
          </>
        )}

        <div className={cn(desktop ? 'mt-5' : 'mt-4', desktop && poll.dates.length > 7 && '-mx-1 overflow-x-auto px-1 pb-2')}>
          {desktop ? (
            <AvailabilityPainter poll={poll} paint={paint} brush={brush} days={poll.dates.map((_, i) => i)} cellHeight={22} />
          ) : (
            <div className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={day}
                  custom={dir}
                  initial={{ x: dir * 32, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: dir * -32, opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                >
                  <AvailabilityPainter poll={poll} paint={paint} brush={brush} days={[day]} cellHeight={44} />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {!desktop && (
          <div className="mt-4 -mx-2 flex items-center justify-between">
            <Button size="sm" variant="ghost" disabled={day === 0} onClick={() => goDay(day - 1)}>
              <ChevronLeft size={13} strokeWidth={2.5} /> {day > 0 ? dayParts(poll.dates[day - 1]).weekday : ''}
            </Button>
            <Button size="sm" variant="ghost" disabled={day === poll.dates.length - 1} onClick={() => goDay(day + 1)}>
              {day < poll.dates.length - 1 ? dayParts(poll.dates[day + 1]).weekday : ''} <ChevronRight size={13} strokeWidth={2.5} />
            </Button>
          </div>
        )}
      </section>

      {/* mobile: thumb-reach dock */}
      {!desktop && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/85 px-4 pt-3 backdrop-blur-xl [padding-bottom:max(12px,env(safe-area-inset-bottom))]">
          <BrushDock brush={brush} onBrush={setBrush} onUndo={paint.undo} canUndo={paint.canUndo} compact />
          <Button variant={marked === 0 ? 'secondary' : 'primary'} size="lg" className="mt-2 w-full" onClick={submit}>
            {submitLabel}
          </Button>
        </div>
      )}
      {!desktop && <div className="h-36" aria-hidden />}
    </div>
  )
}

function DayTabs({ poll, cells, day, onDay }: { poll: Poll; cells: Cells; day: number; onDay: (i: number) => void }) {
  const slots = slotsPerDay(poll)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(`[data-day="${day}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [day])
  return (
    <div ref={ref} role="tablist" aria-label="Day" className="no-scrollbar -mx-4 mt-4 flex snap-x gap-1.5 overflow-x-auto px-4">
      {poll.dates.map((iso, i) => {
        const p = dayParts(iso)
        let n = 0
        for (let s = 0; s < slots; s++) if (cells[cellKey(i, s)]) n++
        const active = i === day
        return (
          <button
            key={iso}
            data-day={i}
            role="tab"
            aria-selected={active}
            onClick={() => onDay(i)}
            className={cn(
              'press relative flex h-[60px] w-[52px] shrink-0 snap-center flex-col items-center justify-center rounded-[14px] transition-colors',
              active ? 'bg-ink text-white' : 'bg-surface text-fg shadow-[0_0_0_1px_var(--color-line-strong)]',
            )}
          >
            <span className={cn('text-2xs font-semibold uppercase', active ? 'text-white/60' : 'text-fg-3')}>{p.weekday}</span>
            <span className="text-md font-semibold tnum">{p.dayNum}</span>
            <span className={cn('absolute bottom-1.5 h-[3px] w-6 overflow-hidden rounded-full', active ? 'bg-white/15' : 'bg-black/[0.06]')}>
              <span className="block h-full origin-left rounded-full bg-pref transition-transform duration-300" style={{ transform: `scaleX(${n / slots})` }} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Step 3 — submitted ───────────────────────────────────────────────────────

function YoureIn({ poll, mine, onEdit }: { poll: Poll; mine: PollResponse; onEdit: () => void }) {
  const c = countCells(mine.cells)
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="card flex flex-wrap items-center gap-4 p-4 sm:p-5"
    >
      <div className="relative">
        <Avatar name={mine.name} size="lg" />
        <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-pref text-pref-ink ring-2 ring-surface">
          <Check size={11} strokeWidth={2.5} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-md font-semibold">You&rsquo;re in, {mine.name}.</div>
        <p className="text-sm text-fg-3">
          <span className="tnum">{c.preferred / 2}</span> h preferred · <span className="tnum">{c.works / 2}</span> h works.{' '}
          {poll.organizerName} will confirm the final time — check back here.
        </p>
      </div>
      <Button variant="secondary" className="ps-3.5" onClick={onEdit}>
        <Pencil size={15} /> Edit my response
      </Button>
    </motion.section>
  )
}
