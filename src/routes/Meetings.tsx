import { CalendarCheck, Check, ChevronRight, Clock, Crown, Hourglass, PencilLine, Plus, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/ui/Avatar'
import { buttonStyles } from '../components/ui/Button'
import { SectionLabel } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import { listNames } from '../lib/explain'
import { organizerPath, participantPath } from '../lib/links'
import { GROUPS, meetingView, type MeetingView } from '../lib/meetings'
import { scoreWindow } from '../lib/rank'
import { dayParts, formatDuration, formatTime, windowLabel } from '../lib/time'
import { usePolls } from '../store/polls'
import { useSession } from '../store/session'

export function Meetings() {
  const polls = usePolls((s) => s.polls)
  const identities = useSession((s) => s.identities)

  const groups = useMemo(() => {
    const views = Object.values(polls).map((p) => meetingView(p, identities[p.id]))
    const when = (v: MeetingView) =>
      v.poll.confirmed ? `${v.poll.dates[v.poll.confirmed.day]}-${String(v.poll.confirmed.startSlot).padStart(3, '0')}` : v.poll.dates[0]
    return GROUPS.map((g) => ({
      ...g,
      items: views
        .filter((v) => v.group === g.id)
        // confirmed: soonest first · everything else: newest first
        .sort((a, b) => (g.id === 'confirmed' ? when(a).localeCompare(when(b)) : b.poll.createdAt - a.poll.createdAt)),
    })).filter((g) => g.items.length > 0)
  }, [polls, identities])

  const needs = groups.find((g) => g.id === 'needs')?.items.length ?? 0
  let index = 0

  return (
    <AppShell crumbs={[{ label: 'Meetings' }]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-semibold">Meetings</h1>
          <p className="mt-1 text-base text-fg-2">
            {needs > 0 ? (
              <>
                <span className="font-medium text-fg">
                  {needs} {needs === 1 ? 'needs' : 'need'} you
                </span>{' '}
                · everything you&rsquo;re organizing or invited to.
              </>
            ) : (
              'You’re all caught up.'
            )}
          </p>
        </div>
        <Link to="/new" className={cn(buttonStyles({ variant: 'primary' }), 'ps-3.5')}>
          <Plus size={15} strokeWidth={2.5} /> New poll
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g.id} aria-label={g.label}>
            <SectionLabel right={`${g.items.length}`}>{g.label}</SectionLabel>
            {/* grid-cols-1 = minmax(0,1fr): without it the implicit `auto` column lets
                truncated titles push the card past the viewport on phones */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {g.items.map((v) => (
                <MeetingCard key={v.poll.id} view={v} index={index++} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 px-1 text-sm text-fg-3">
        Demo: you&rsquo;re seeing this as <span className="font-medium text-fg-2">Maya</span>. Switch roles from the demo dock — the dashboard follows.
      </p>
    </AppShell>
  )
}

// ── card ─────────────────────────────────────────────────────────────────────

function MeetingCard({ view, index }: { view: MeetingView; index: number }) {
  const { poll, role, me, myResponse } = view
  const setIdentity = useSession((s) => s.setIdentity)
  const identity = useSession((s) => s.identities[poll.id])
  const to = role === 'organizer' ? organizerPath(poll) : participantPath(poll)
  const first = dayParts(poll.dates[0])
  const last = dayParts(poll.dates[poll.dates.length - 1])

  return (
    <motion.div
      className="min-w-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1], delay: Math.min(index, 6) * 0.04 }}
    >
      <Link
        to={to}
        // carry "who you are" into the poll so it opens in the right state
        onClick={() => !identity && setIdentity(poll.id, { name: me, responseId: myResponse?.id })}
        aria-label={`${poll.name}, ${statusCopy(view).title}`}
        // concentric: card 20px = tile/strip 10px + 10px padding
        className="card group block p-2.5 transition-[box-shadow,scale] duration-200 ease-out hover:shadow-raised active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <DateTile view={view} />
          <div className="min-w-0 flex-1">
            {/* wraps on narrow cards so the title isn't truncated just to fit the chip */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="min-w-0 max-w-full truncate text-md font-semibold">{poll.name}</h3>
              <RoleChip view={view} />
            </div>
            <p className="mt-1 truncate text-sm text-fg-3 tnum">
              {poll.dates.length === 1 ? first.medium : `${first.short} – ${last.short}`} · {formatDuration(poll.duration)} ·{' '}
              {formatTime(poll.dayStartMin, { compact: true })}–{formatTime(poll.dayEndMin, { compact: true })}
            </p>
          </div>
          <ChevronRight
            size={14} strokeWidth={2.5}
            className="me-2 shrink-0 text-fg-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-fg-3"
          />
        </div>
        <StatusStrip view={view} />
      </Link>
    </motion.div>
  )
}

/**
 * A tiny calendar page: month on a tinted band, date centred in the space below.
 * Confirmed meetings get the ink page with a green band — the same pair as the ticket.
 */
function DateTile({ view }: { view: MeetingView }) {
  const { poll } = view
  const confirmed = poll.status === 'confirmed' && poll.confirmed
  let month: string
  let value: string
  if (confirmed) {
    const l = windowLabel(poll, poll.confirmed!.day, poll.confirmed!.startSlot, poll.duration)
    month = l.month
    value = l.dayNum
  } else {
    const first = dayParts(poll.dates[0])
    const last = dayParts(poll.dates[poll.dates.length - 1])
    month = first.month
    value = poll.dates.length === 1 ? first.dayNum : `${first.dayNum}–${last.dayNum}`
  }
  const isRange = value.includes('–')

  return (
    <div
      aria-hidden
      className={cn(
        'flex h-[60px] w-[60px] shrink-0 flex-col overflow-hidden rounded-[10px]',
        confirmed ? 'bg-ink text-white' : 'border border-line-strong bg-surface',
      )}
    >
      <div
        className={cn(
          'flex h-[18px] shrink-0 items-center justify-center',
          confirmed ? 'bg-pref text-pref-ink' : 'bg-black/[0.045] text-fg-2',
        )}
      >
        <span className="glyph text-[9px] font-bold tracking-[0.1em] uppercase">{month}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className={cn('glyph font-semibold tracking-[-0.03em]', isRange ? 'text-[15px]' : 'text-[22px]')}>{value}</span>
      </div>
    </div>
  )
}

function RoleChip({ view }: { view: MeetingView }) {
  if (view.role === 'organizer') {
    return (
      <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-accent-soft ps-1.5 pe-2 text-2xs font-semibold text-accent">
        <Crown size={10} fill="currentColor" /> Organizing
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-black/[0.045] px-2 text-2xs font-semibold text-fg-2">
      From {view.poll.organizerName}
    </span>
  )
}

function statusCopy(view: MeetingView): { title: string; detail: string; icon: ReactNode; tone: string } {
  const { poll, result } = view
  const lead = result.options[0]
  const leadLabel = lead ? windowLabel(poll, lead.day, lead.startSlot, poll.duration) : null
  const invited = result.invitedCount ?? result.responded

  switch (view.status) {
    case 'needs-availability':
      return {
        title: 'Add your availability',
        detail: `${poll.organizerName} is waiting · ${result.responded} of ${invited} have responded`,
        icon: <PencilLine size={14} strokeWidth={2.5} />,
        tone: 'bg-accent text-white',
      }
    case 'ready':
      return {
        title: 'Ready to decide',
        detail: leadLabel ? `${leadLabel.weekday} ${leadLabel.time} leads · ${lead.attendance}/${result.responded} can attend` : 'Everyone’s in',
        icon: <Sparkles size={14} fill="currentColor" />,
        tone: 'bg-pref text-pref-ink',
      }
    case 'collecting':
      return {
        title: 'Collecting responses',
        detail: result.pendingNames.length
          ? `${result.responded} of ${invited} · waiting on ${listNames(result.pendingNames)}`
          : `${result.responded} ${result.responded === 1 ? 'response' : 'responses'} so far`,
        icon: <Hourglass size={14} strokeWidth={2.5} />,
        tone: 'bg-black/[0.07] text-fg-2',
      }
    case 'waiting':
      return {
        title: `Waiting on ${poll.organizerName}`,
        detail: leadLabel ? `You’re in · ${leadLabel.weekday} ${leadLabel.time} leads so far` : 'You’re in',
        icon: <Clock size={14} strokeWidth={2.5} />,
        tone: 'bg-black/[0.07] text-fg-2',
      }
    case 'confirmed': {
      const c = poll.confirmed!
      const l = windowLabel(poll, c.day, c.startSlot, poll.duration)
      const w = scoreWindow(poll, c.day, c.startSlot)
      return {
        title: `${l.medium} · ${l.range}`,
        detail: `Confirmed by ${poll.organizerName} · ${w.attendance} of ${poll.responses.length} can attend`,
        icon: <Check size={14} strokeWidth={2.5} />,
        tone: 'bg-pref text-pref-ink',
      }
    }
  }
}

function StatusStrip({ view }: { view: MeetingView }) {
  const { poll, result } = view
  const copy = statusCopy(view)
  const attendees =
    poll.status === 'confirmed' && poll.confirmed
      ? scoreWindow(poll, poll.confirmed.day, poll.confirmed.startSlot).people.filter((p) => p.state > 0).map((p) => p.name)
      : poll.responses.map((r) => r.name)
  const pending = poll.status === 'confirmed' ? [] : result.pendingNames
  const shown = [...attendees.map((n) => ({ n, pending: false })), ...pending.map((n) => ({ n, pending: true }))]
  const max = 5

  return (
    <div className="mt-2.5 flex items-center gap-3 rounded-[10px] bg-sunken px-3 py-2.5">
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-[8px]', copy.tone)}>
        {poll.status === 'confirmed' ? <CalendarCheck size={14} strokeWidth={2.5} /> : copy.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold tnum">{copy.title}</div>
        <div className="truncate text-xs text-fg-3 tnum">{copy.detail}</div>
      </div>
      <div className="flex shrink-0 items-center" aria-hidden>
        {shown.slice(0, max).map((p, i) => (
          <Avatar key={p.n} name={p.n} size="xs" status={p.pending ? 'pending' : undefined} className={cn(i > 0 && '-ms-1.5')} />
        ))}
        {shown.length > max && (
          <span className="-ms-1.5 grid size-5 place-items-center rounded-full bg-surface text-[9px] font-semibold text-fg-2 ring-2 ring-sunken">
            <span className="glyph">+{shown.length - max}</span>
          </span>
        )}
      </div>
    </div>
  )
}
