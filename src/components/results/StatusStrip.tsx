import NumberFlow from '@number-flow/react'
import { BellRing, Link2 } from 'lucide-react'
import { listNames } from '../../lib/explain'
import type { RankResult } from '../../lib/rank'
import type { Poll } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { Eyebrow } from '../ui/Card'
import { cn } from '../ui/cn'
import { CopyButton } from '../ui/CopyButton'
import { ProgressSegments } from '../ui/ProgressSegments'

export function reminderMessage(poll: Poll, url: string) {
  return `We’re still picking a time for ${poll.name}. Add your availability here: ${url}`
}

/** PRD Feature 3 — response status + lightweight nudge. CommonTime never sends messages itself. */
export function StatusStrip({ poll, result, participantUrl, className }: { poll: Poll; result: RankResult; participantUrl: string; className?: string }) {
  const invited = result.invitedCount
  const pending = result.pendingNames
  const done = pending.length === 0

  return (
    <section aria-label="Responses" className={cn('card flex flex-col p-4 sm:p-5', className)}>
      <Eyebrow
        className="h-8"
        right={
          invited && !done ? (
            <CopyButton
              size="sm"
              variant="secondary"
              text={reminderMessage(poll, participantUrl)}
              label="Copy reminder"
              copiedLabel="Reminder copied"
              icon={<BellRing size={15} strokeWidth={2.5} />}
              toastMessage={`Reminder copied — paste it in your group chat for ${listNames(pending)}.`}
            />
          ) : (
            <CopyButton size="sm" text={participantUrl} label="Copy link" icon={<Link2 size={15} strokeWidth={2.5} />} toastMessage="Poll link copied" />
          )
        }
      >
        Responses
      </Eyebrow>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tracking-[-0.02em]">
          <NumberFlow value={result.responded} />
        </span>
        <span className="text-md text-fg-2">
          {invited ? (
            <>
              of <span className="tnum">{invited}</span> responded
            </>
          ) : (
            `${result.responded === 1 ? 'response' : 'responses'} received`
          )}
        </span>
      </div>

      {invited && <ProgressSegments value={result.responded} total={invited} className="mt-3" />}

      {/* pinned to the bottom so the card can stretch to its neighbour's height */}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
        <div className="flex items-center">
          {poll.responses.map((r, i) => (
            <Avatar key={r.id} name={r.name} size="md" className={cn(i > 0 && '-ms-2')} title={`${r.name} responded`} />
          ))}
          {pending.map((n) => (
            <Avatar key={n} name={n} size="md" status="pending" className="-ms-2" title={`${n} hasn’t responded`} />
          ))}
        </div>
        <p className="text-sm text-fg-2">
          {invited
            ? done
              ? 'Everyone’s in.'
              : <>Waiting on <span className="font-medium text-fg">{listNames(pending)}</span></>
            : 'No invite list — anyone with the link can respond.'}
        </p>
      </div>
    </section>
  )
}
