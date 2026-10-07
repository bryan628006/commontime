import { Check, Star, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { listNames } from '../../lib/explain'
import { scoreWindow } from '../../lib/rank'
import { windowLabel } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { Dialog, DialogClose } from '../ui/Dialog'
import type { WindowRef } from '../grid/GroupHeatmap'

/** PRD Feature 4 — the organizer always sees attendance consequences before confirming. */
export function ConfirmDialog({
  poll,
  target,
  pendingNames,
  onOpenChange,
  onConfirm,
}: {
  poll: Poll
  target: WindowRef | null
  pendingNames: string[]
  onOpenChange: (open: boolean) => void
  onConfirm: (w: WindowRef) => void
}) {
  // keep rendering the last target while the exit animation plays
  const [last, setLast] = useState(target)
  if (target && target !== last) setLast(target)
  const shown = target ?? last
  const score = shown ? scoreWindow(poll, shown.day, shown.startSlot) : null
  const label = shown ? windowLabel(poll, shown.day, shown.startSlot, poll.duration) : null
  const total = poll.responses.length
  const cant = score?.people.filter((p) => p.state === 0) ?? []

  const groups = score
    ? [
        { key: 'p', title: 'Preferred', icon: <Star fill="currentColor" size={11} />, tone: 'bg-pref text-pref-ink', people: score.people.filter((p) => p.state === 2) },
        { key: 'w', title: 'Works', icon: <Check strokeWidth={2.5} size={11} />, tone: 'hatch text-works-ink', people: score.people.filter((p) => p.state === 1) },
        { key: 'u', title: 'Can’t make it', icon: <X strokeWidth={2.5} size={11} />, tone: 'bg-black/[0.07] text-fg-3', people: cant },
      ]
    : []

  return (
    <Dialog
      open={!!target}
      onOpenChange={onOpenChange}
      title="Confirm this time?"
      description="Everyone with the link will see it as the final meeting time."
    >
      {score && label && shown && (
        // every panel is 8px in from the 24px popup → 16px radius (concentric), 8px apart
        <div className="flex flex-col gap-2">
          <div className="rounded-[16px] bg-sunken p-4">
            <div className="text-xs font-medium text-fg-3">{poll.name}</div>
            <div className="mt-1 text-sm text-fg-2">{label.long}</div>
            <div className="text-xl font-semibold tracking-[-0.02em] tnum">{label.range}</div>
            <div className="mt-4 flex flex-col gap-2">
              {groups.map((g) =>
                g.people.length ? (
                  <div key={g.key} className="flex items-center gap-2">
                    <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-[5px]', g.tone)}>{g.icon}</span>
                    <span className="w-28 shrink-0 text-xs font-medium text-fg-2">
                      {g.title} <span className="text-fg-4 tnum">{g.people.length}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {g.people.map((p) => (
                        <Avatar key={p.responseId} name={p.name} size="sm" title={p.name} />
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          {(cant.length > 0 || pendingNames.length > 0) && (
            <div role="alert" className="flex gap-3 rounded-[16px] bg-warn p-4 text-sm text-warn-ink shadow-[inset_0_0_0_1px_var(--color-warn-line)]">
              <TriangleAlert size={18} strokeWidth={2.25} className="mt-px shrink-0" />
              <div>
                {cant.length > 0 && (
                  <p>
                    <span className="font-semibold tnum">
                      {score.attendance} of {total}
                    </span>{' '}
                    participants can attend. {listNames(cant.map((p) => p.name))} {cant.length === 1 ? 'is' : 'are'} unavailable.
                  </p>
                )}
                {pendingNames.length > 0 && (
                  <p className={cn(cant.length > 0 && 'mt-1')}>
                    {listNames(pendingNames)} {pendingNames.length === 1 ? 'hasn’t' : 'haven’t'} responded yet.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <DialogClose render={<Button variant="secondary" size="lg" className="flex-1" style={{ borderRadius: 16 }} />}>Back</DialogClose>
            <Button variant="primary" size="lg" className="flex-[2]" style={{ borderRadius: 16 }} onClick={() => onConfirm(shown)}>
              <Check size={16} strokeWidth={2.5} /> Confirm this time
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
