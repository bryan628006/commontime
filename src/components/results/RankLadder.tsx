import { CircleCheck, Equal, Scale, Star, Users } from 'lucide-react'
import { ladder } from '../../lib/explain'
import type { WindowScore } from '../../lib/rank'
import { cn } from '../ui/cn'

const ICONS = {
  attendance: <Users size={13} strokeWidth={2.5} />,
  preference: <Star size={13} strokeWidth={2.5} />,
  fairness: <Scale size={13} strokeWidth={2.5} />,
}

/**
 * Attendance → Preference → Fairness. Shows the exact step that separated two options,
 * with both sides' numbers, so the ranking never feels like a black box.
 */
export function RankLadder({
  me,
  other,
  myLabel,
  otherLabel,
}: {
  me: WindowScore
  other?: WindowScore
  myLabel: string
  otherLabel?: string
}) {
  const { steps, decided } = ladder(me, other)
  if (!other) return null
  return (
    // concentric: panel 14px = row 8px + 6px padding
    <div className="rounded-[14px] bg-sunken p-1.5">
      <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2 text-2xs font-medium text-fg-3">
        <span className="tnum">
          {myLabel} <span className="text-fg-4">vs</span> {otherLabel}
        </span>
        <span className="shrink-0">{decided === 'tied' ? 'Tied on every step' : `Decided by ${decided}`}</span>
      </div>
      <ol className="relative flex flex-col gap-0.5">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              'relative flex h-10 items-center gap-2.5 rounded-[8px] px-2 transition-colors',
              s.outcome === 'decided' && 'bg-surface shadow-[0_0_0_1px_var(--color-line),0_1px_2px_rgb(0_0_0/0.05)]',
              s.outcome === 'unused' && 'opacity-45',
            )}
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full',
                s.outcome === 'decided' ? 'bg-ink text-white' : 'bg-black/[0.06] text-fg-2',
              )}
            >
              {ICONS[s.id]}
            </span>
            <span className="flex-1 text-sm">
              <span className="text-fg-4 tnum">{i + 1}.</span> {s.label}
            </span>
            <span className="text-xs font-semibold tnum">{s.mine}</span>
            <span className="text-2xs text-fg-4">vs</span>
            <span className="text-xs text-fg-3 tnum">{s.theirs}</span>
            <span className="w-4 shrink-0 text-fg-3">
              {s.outcome === 'same' && <Equal size={13} aria-label="same" />}
              {s.outcome === 'decided' && <CircleCheck size={14} fill="currentColor" stroke="white" strokeWidth={2.5} className="text-pref-strong" aria-label="decided here" />}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
