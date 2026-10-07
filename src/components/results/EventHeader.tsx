import { Calendar, Clock, Hourglass } from 'lucide-react'
import type { ReactNode } from 'react'
import { dateRangeLabel, formatDuration, formatTime } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { cn } from '../ui/cn'

export function EventHeader({ poll, className, children }: { poll: Poll; className?: string; children?: ReactNode }) {
  return (
    <section className={cn('card flex flex-col p-4 sm:p-5', className)}>
      <div className="flex h-5 items-center gap-2 text-sm text-fg-2">
        <Avatar name={poll.organizerName} size="xs" />
        <span>
          <span className="font-medium text-fg">{poll.organizerName}</span> is organizing
        </span>
      </div>
      <h1 className="mt-2 text-xl font-semibold">{poll.name}</h1>
      {poll.note && <p className="mt-1 max-w-[60ch] text-base text-fg-2">{poll.note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Meta icon={<Calendar size={14} />}>{dateRangeLabel(poll.dates)}</Meta>
        <Meta icon={<Clock size={14} />}>
          {formatTime(poll.dayStartMin, { compact: true })} – {formatTime(poll.dayEndMin, { compact: true })}
        </Meta>
        <Meta icon={<Hourglass size={14} />}>{formatDuration(poll.duration)} meeting</Meta>
      </div>
      {children}
    </section>
  )
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    // static metadata: tinted + borderless so it never reads as a button
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-black/[0.045] ps-2 pe-2.5 text-sm text-fg-2 tnum">
      <span className="text-fg-3">{icon}</span>
      {children}
    </span>
  )
}
