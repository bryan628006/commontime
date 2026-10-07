import { ChevronDown, Crown, Link2, Lock, MessageSquareText, Pencil, TriangleAlert, Undo2 } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { AppShell } from '../components/AppShell'
import type { WindowRef } from '../components/grid/GroupHeatmap'
import { ConfirmDialog } from '../components/results/ConfirmDialog'
import { ConfirmedTicket } from '../components/results/ConfirmedTicket'
import { EventHeader } from '../components/results/EventHeader'
import { ResultsPanel } from '../components/results/ResultsPanel'
import { StatusStrip } from '../components/results/StatusStrip'
import { Button } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import { CopyButton } from '../components/ui/CopyButton'
import { Dialog, DialogClose } from '../components/ui/Dialog'
import { listNames } from '../lib/explain'
import { participantPath, participantUrl } from '../lib/links'
import { confirmedAttendance, rankPoll } from '../lib/rank'
import { windowLabel } from '../lib/time'
import type { Poll } from '../lib/types'
import { usePoll, usePolls } from '../store/polls'
import { useSession } from '../store/session'
import { NotFound } from './NotFound'

export function Organizer() {
  const { id, token } = useParams()
  const poll = usePoll(id)
  if (!poll) return <NotFound />
  if (poll.adminToken !== token)
    return <NotFound title="This organizer link isn’t valid" body="Organizer links are private. Ask whoever created the poll for theirs — or open the participant link instead." />
  return <OrganizerInner poll={poll} />
}

function OrganizerInner({ poll }: { poll: Poll }) {
  const navigate = useNavigate()
  const result = useMemo(() => rankPoll(poll), [poll])
  const confirm = usePolls((s) => s.confirm)
  const reopen = usePolls((s) => s.reopen)
  const setProceedEarly = usePolls((s) => s.setProceedEarly)
  const setIdentity = useSession((s) => s.setIdentity)
  const [target, setTarget] = useState<WindowRef | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const url = participantUrl(poll)
  const confirmed = poll.status === 'confirmed' && !!poll.confirmed
  const attendance = confirmedAttendance(poll)

  const editMine = () => {
    const mine = poll.responses.find((r) => r.name.toLowerCase() === poll.organizerName.toLowerCase())
    setIdentity(poll.id, { name: poll.organizerName, responseId: mine?.id })
    navigate(participantPath(poll))
  }

  const doConfirm = (w: WindowRef) => {
    confirm(poll.id, w.day, w.startSlot)
    setTarget(null)
    setCelebrate(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finalMessage = confirmed
    ? (() => {
        const l = windowLabel(poll, poll.confirmed!.day, poll.confirmed!.startSlot, poll.duration)
        return `${poll.name} is confirmed for ${l.long}, ${l.range}. Details + add to calendar: ${url}`
      })()
    : ''

  return (
    <AppShell
      crumbs={[{ label: 'Meetings', to: '/meetings' }, { label: poll.name }]}
      wide
      badge={
        <span className="ms-1 hidden items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent sm:inline-flex">
          <Crown size={11} fill="currentColor" /> Organizer
        </span>
      }
    >
      <LayoutGroup>
        <div className="flex flex-col gap-8">
          {confirmed ? (
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
              <ConfirmedTicket poll={poll} shareUrl={url} celebrate={celebrate} pendingNames={result.pendingNames} calendarVariant="secondary">
                <Button variant="secondary" className="ps-3.5" onClick={() => setReopenOpen(true)}>
                  <Undo2 size={15} strokeWidth={2.5} /> Reopen poll
                </Button>
              </ConfirmedTicket>
              <div className="flex flex-col gap-4">
                {attendance && attendance.conflicts.length > 0 && (
                  <div role="alert" className="flex gap-3 rounded-[16px] bg-warn p-4 text-sm text-warn-ink shadow-[inset_0_0_0_1px_var(--color-warn-line)]">
                    <TriangleAlert size={18} strokeWidth={2.25} className="mt-px shrink-0" />
                    <p>
                      <span className="font-semibold">{listNames(attendance.conflicts.map((c) => c.name))}</span> changed their availability and can
                      no longer make it. The meeting stays confirmed — reopen the poll if you want to pick again.
                    </p>
                  </div>
                )}
                <section className="card p-4 sm:p-5">
                  <Eyebrow className="h-6">Let the group know</Eyebrow>
                  <p className="mt-3 rounded-[12px] bg-sunken p-3 text-sm text-fg-2">{finalMessage}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyButton
                      variant="primary"
                      text={finalMessage}
                      label="Copy announcement"
                      icon={<MessageSquareText size={15} strokeWidth={2.5} />}
                      toastMessage="Announcement copied — paste it in your group chat."
                    />
                    <CopyButton text={url} label="Copy link" icon={<Link2 size={15} strokeWidth={2.5} />} />
                  </div>
                  <p className="mt-3 text-xs text-fg-3">Anyone opening the link now sees the confirmed time first.</p>
                </section>
              </div>
            </div>
          ) : (
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
              <EventHeader poll={poll}>
                {/* pinned to the bottom so it lines up with the status card's footer */}
                <div className="mt-auto pt-5">
                  <div className="dashed-divider" />
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
                    <CopyButton size="sm" text={url} label="Copy participant link" icon={<Link2 size={14} strokeWidth={2.5} />} toastMessage="Participant link copied" />
                    <Button size="sm" variant="ghost" className="ps-2.5" onClick={editMine}>
                      <Pencil size={14} /> Edit my availability
                    </Button>
                    <span className="ms-auto inline-flex items-center gap-1.5 text-xs text-fg-3">
                      <Lock size={12} /> Private to you
                    </span>
                  </div>
                </div>
              </EventHeader>
              <StatusStrip poll={poll} result={result} participantUrl={url} />
            </div>
          )}

          {confirmed ? (
            <div>
              <button
                type="button"
                onClick={() => setShowResults((v) => !v)}
                aria-expanded={showResults}
                className="press -ms-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2 text-sm font-medium text-fg-2 hover:bg-black/[0.04] hover:text-fg"
              >
                {showResults ? 'Hide' : 'Show'} group results
                <ChevronDown size={12} strokeWidth={2.5} className={cn('transition-transform duration-200', showResults && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className="mt-3"
                  >
                    <ResultsPanel poll={poll} result={result} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <ResultsPanel poll={poll} result={result} onChoose={setTarget} onProceed={() => setProceedEarly(poll.id, true)} />
          )}
        </div>
      </LayoutGroup>

      <ConfirmDialog
        poll={poll}
        target={target}
        pendingNames={result.pendingNames}
        onOpenChange={(o) => !o && setTarget(null)}
        onConfirm={doConfirm}
      />

      <Dialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title="Reopen this poll?"
        description="Reopening this poll removes the confirmed state and may change the final meeting time."
      >
        <div className="flex gap-2">
          <DialogClose render={<Button variant="secondary" size="lg" className="flex-1" style={{ borderRadius: 16 }} />}>
            Keep it confirmed
          </DialogClose>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            style={{ borderRadius: 16 }}
            onClick={() => {
              reopen(poll.id)
              setReopenOpen(false)
              setCelebrate(false)
              toast('Poll reopened', { description: 'Responses are open again.' })
            }}
          >
            Reopen poll
          </Button>
        </div>
      </Dialog>
    </AppShell>
  )
}
