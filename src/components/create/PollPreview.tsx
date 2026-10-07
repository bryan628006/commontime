import { CircleCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { dateRangeLabel, dayParts, formatDuration, formatTime } from '../../lib/time'
import { Avatar } from '../ui/Avatar'
import { Eyebrow } from '../ui/Card'

/** Live miniature of the poll participants will see. Updates as the organizer edits. */
export function PollPreview({
  name,
  organizer,
  dates,
  start,
  end,
  duration,
  invitees,
}: {
  name: string
  organizer: string
  dates: string[]
  start: number
  end: number
  duration: number
  invitees: string[]
}) {
  const rows = Math.max(1, Math.round((end - start) / 60))
  const cols = dates.length
  return (
    <section aria-label="Preview" className="card overflow-hidden">
      <div className="p-5 pb-4">
        <Eyebrow>Preview</Eyebrow>
        <div className="mt-3 flex items-center gap-2 text-sm text-fg-2">
          <Avatar name={organizer || 'you'} size="xs" />
          <span>
            <span className="font-medium text-fg">{organizer || 'You'}</span> is organizing
          </span>
        </div>
        <div className={name ? 'mt-1.5 text-lg font-semibold' : 'mt-1.5 text-lg font-semibold text-fg-4'}>{name || 'Untitled poll'}</div>
        <div className="mt-1 text-sm text-fg-3 tnum">
          {dateRangeLabel(dates)} · {formatTime(start, { compact: true })}–{formatTime(end, { compact: true })} · {formatDuration(duration)}
        </div>
      </div>

      <div className="border-t border-line bg-sunken px-5 py-4">
        {cols === 0 ? (
          <div className="grid h-[148px] place-items-center rounded-[12px] border border-dashed border-line-strong text-sm text-fg-4">Pick some days</div>
        ) : (
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {dates.map((d) => (
              <motion.div
                layout
                key={d}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
                className="flex min-w-0 flex-col gap-[3px]"
              >
                <div className="truncate pb-1 text-center text-[10px] font-semibold text-fg-3 uppercase">
                  {cols > 9 ? dayParts(d).weekday[0] : dayParts(d).weekday}
                </div>
                {Array.from({ length: Math.min(rows, 16) }, (_, r) => (
                  <div key={r} className="h-[7px] rounded-[2px] bg-surface shadow-[0_0_0_1px_var(--color-line)]" />
                ))}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-2 p-5 text-sm text-fg-2">
        {[
          'No account needed to respond',
          'Preferred vs. Works — not just free or busy',
          invitees.length ? `${invitees.length} invited · you’ll see who’s pending` : 'Anyone with the link can respond',
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CircleCheck size={16} fill="currentColor" stroke="white" strokeWidth={2.5} className="shrink-0 text-pref-strong" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  )
}
