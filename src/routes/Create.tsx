import { ArrowRight, Info } from 'lucide-react'
import { addDays, format, nextMonday, startOfDay } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '../components/AppShell'
import { DayPicker, MAX_DAYS } from '../components/create/DayPicker'
import { InviteeInput } from '../components/create/InviteeInput'
import { PollPreview } from '../components/create/PollPreview'
import { ShareCard } from '../components/create/ShareCard'
import { TimeRangeSlider } from '../components/create/TimeRangeSlider'
import { Button } from '../components/ui/Button'
import { cn } from '../components/ui/cn'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { organizerPath, participantPath } from '../lib/links'
import type { Duration, Poll } from '../lib/types'
import { usePolls } from '../store/polls'
import { useSession } from '../store/session'

const defaultDates = () => {
  const mon = nextMonday(startOfDay(new Date()))
  return Array.from({ length: 5 }, (_, i) => format(addDays(mon, i), 'yyyy-MM-dd'))
}

export function Create() {
  const navigate = useNavigate()
  const createPoll = usePolls((s) => s.createPoll)
  const setIdentity = useSession((s) => s.setIdentity)

  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [organizer, setOrganizer] = useState('')
  const [dates, setDates] = useState<string[]>(defaultDates)
  const [start, setStart] = useState(10 * 60)
  const [end, setEnd] = useState(20 * 60)
  const [duration, setDuration] = useState<Duration>(60)
  const [invitees, setInvitees] = useState<string[]>([])
  const [limitHit, setLimitHit] = useState(false)
  const [tried, setTried] = useState(false)
  const [created, setCreated] = useState<Poll | null>(null)

  const problems = [
    !name.trim() && 'Give the event a name',
    !organizer.trim() && 'Add your name',
    dates.length === 0 && 'Pick at least one day',
  ].filter(Boolean) as string[]

  const changeDuration = (d: Duration) => {
    setDuration(d)
    if (end - start < d) {
      if (start + d <= 1440) setEnd(start + d)
      else setStart(end - d)
    }
  }

  const submit = () => {
    setTried(true)
    if (problems.length) return
    const org = organizer.trim()
    const list = invitees.length && !invitees.some((n) => n.toLowerCase() === org.toLowerCase()) ? [org, ...invitees] : invitees
    const poll = createPoll({
      name: name.trim(),
      note: note.trim() || undefined,
      organizerName: org,
      dates,
      dayStartMin: start,
      dayEndMin: end,
      duration,
      invitees: list,
    })
    setIdentity(poll.id, { name: org })
    setCreated(poll)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppShell crumbs={[{ label: 'Meetings', to: '/meetings' }, { label: created ? created.name : 'New poll' }]} wide>
      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <ShareCard
            key="share"
            poll={created}
            onAddMine={() => navigate(participantPath(created))}
            onOpenOrganizer={() => navigate(organizerPath(created))}
          />
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
            {/* title spans both columns so the first card and the preview start on the same line */}
            <div className="mb-6 px-1">
              <h1 className="text-xl font-semibold">Start a poll</h1>
              <p className="mt-1 text-base text-fg-2">Takes about a minute. No account — you&rsquo;ll get a private organizer link.</p>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex flex-col gap-4">
              <Section step={1} title="Name it">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Event" error={tried && !name.trim()}>
                    <input
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Capstone team sync"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Your name" error={tried && !organizer.trim()}>
                    <input
                      value={organizer}
                      maxLength={40}
                      autoComplete="given-name"
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="Maya"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Context note" optional className="mt-4">
                  <textarea
                    value={note}
                    maxLength={160}
                    rows={2}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What’s it for? Anything people should know?"
                    className={textareaCls}
                  />
                </Field>
              </Section>

              <Section
                step={2}
                title="Which days?"
                aside={
                  <span className={cn('text-sm tnum', limitHit ? 'font-medium text-warn-ink' : 'text-fg-3')}>
                    {dates.length}/{MAX_DAYS} days
                  </span>
                }
              >
                <DayPicker
                  value={dates}
                  onChange={(d) => {
                    setDates(d)
                    setLimitHit(false)
                  }}
                  onLimit={() => setLimitHit(true)}
                />
                <AnimatePresence>
                  {limitHit && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-center gap-1.5 text-sm text-warn-ink"
                    >
                      <Info size={15} strokeWidth={2.25} /> Up to 14 days — shorter windows get faster, more accurate answers.
                    </motion.p>
                  )}
                </AnimatePresence>
              </Section>

              <Section step={3} title="What hours?">
                <TimeRangeSlider
                  start={start}
                  end={end}
                  minGap={duration}
                  onChange={(s, e) => {
                    setStart(s)
                    setEnd(e)
                  }}
                />
              </Section>

              <Section step={4} title="How long is the meeting?">
                <SegmentedControl
                  label="Meeting length"
                  value={duration}
                  onChange={changeDuration}
                  options={[
                    { value: 30, label: '30 min' },
                    { value: 60, label: '1 hr' },
                    { value: 90, label: '1.5 hr' },
                    { value: 120, label: '2 hr' },
                  ]}
                  className="max-w-[440px]"
                />
                <p className="mt-3 text-sm text-fg-3">We&rsquo;ll only recommend windows where people are free for the whole meeting.</p>
              </Section>

              <Section step={5} title="Who’s invited?" optional>
                <InviteeInput value={invitees} onChange={setInvitees} />
              </Section>

              <div className="flex flex-col-reverse items-stretch gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                <AnimatePresence>
                  {tried && problems.length > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="text-sm text-danger">
                      {problems.join(' · ')}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button variant="primary" size="lg" className="pe-[18px] sm:ms-auto sm:min-w-[200px]" onClick={submit}>
                  Create poll <ArrowRight size={15} strokeWidth={2.5} />
                </Button>
              </div>
            </div>

            <div className="hidden lg:sticky lg:top-20 lg:block">
              <PollPreview name={name} organizer={organizer} dates={dates} start={start} end={end} duration={duration} invitees={invitees} />
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

const fieldBase =
  'w-full rounded-[12px] bg-surface px-3.5 text-md shadow-[0_0_0_1px_var(--color-line-strong)] outline-none transition-shadow placeholder:text-fg-4 focus:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)]'
const inputCls = `${fieldBase} h-11`
const textareaCls = `${fieldBase} resize-none py-2.5`

function Section({ step, title, optional, aside, children }: { step: number; title: string; optional?: boolean; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex h-6 items-center gap-2.5">
        <span className="grid size-6 place-items-center rounded-full bg-sunken text-xs font-semibold text-fg-2 shadow-[inset_0_0_0_1px_var(--color-line)] tnum">
          <span className="glyph">{step}</span>
        </span>
        <h2 className="text-md font-semibold">{title}</h2>
        {optional && <span className="text-sm text-fg-3">Optional</span>}
        <span className="ms-auto">{aside}</span>
      </div>
      {children}
    </section>
  )
}

function Field({ label, optional, error, className, children }: { label: string; optional?: boolean; error?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex h-5 items-center gap-1.5 text-sm font-medium text-fg-2">
        {label}
        {optional && <span className="font-normal text-fg-3">Optional</span>}
        {error && <span className="font-normal text-danger">Required</span>}
      </span>
      {children}
    </label>
  )
}
