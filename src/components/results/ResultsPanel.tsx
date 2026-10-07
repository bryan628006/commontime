import { Hourglass, Info, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { respondedLabel } from '../../lib/explain'
import { useIsDesktop } from '../../lib/hooks'
import type { RankResult, Recommendation } from '../../lib/rank'
import { windowLabel } from '../../lib/time'
import type { Poll } from '../../lib/types'
import { GroupHeatmap, type HeatMode, type WindowRef } from '../grid/GroupHeatmap'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { SectionLabel } from '../ui/Card'
import { cn } from '../ui/cn'
import { SegmentedControl } from '../ui/SegmentedControl'
import { RecommendationCard } from './RecommendationCard'

export function ResultsPanel({
  poll,
  result,
  onChoose,
  onProceed,
  readOnlyNote,
}: {
  poll: Poll
  result: RankResult
  /** organizer only */
  onChoose?: (w: WindowRef) => void
  onProceed?: () => void
  readOnlyNote?: string
}) {
  const [mode, setMode] = useState<HeatMode>('attend')
  const [hoverRec, setHoverRec] = useState<Recommendation | null>(null)
  const [pinnedPerson, setPerson] = useState<string | null>(null)
  const [peekPerson, setPeekPerson] = useState<string | null>(null)
  const person = peekPerson ?? pinnedPerson
  const desktop = useIsDesktop()
  const total = poll.responses.length

  const personName = person ? poll.responses.find((r) => r.id === person)?.name : null

  return (
    <div className="grid items-start gap-x-4 gap-y-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* heatmap */}
      <section aria-label="Group availability" className="min-w-0 lg:sticky lg:top-20">
        <SectionLabel right={personName ? `Showing only ${personName}` : `${total} ${total === 1 ? 'response' : 'responses'}`}>
          Group availability
        </SectionLabel>

        <div className="card p-4 sm:p-5">
          {/* controls row: who (leading) · how to colour (trailing) */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            {/* roster — hover or tap someone to isolate their availability */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Show one person">
              {poll.responses.map((r) => {
                const on = pinnedPerson === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPerson(on ? null : r.id)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setPeekPerson(r.id)}
                    onPointerLeave={() => setPeekPerson(null)}
                    className={cn(
                      'press inline-flex h-8 items-center gap-1.5 rounded-full ps-0.5 pe-3 text-sm transition-[background-color,box-shadow,color]',
                      on ? 'bg-ink text-white' : 'bg-surface text-fg-2 shadow-[0_0_0_1px_var(--color-line-strong)] hover:text-fg',
                    )}
                  >
                    <Avatar name={r.name} size="sm" />
                    {r.name}
                  </button>
                )
              })}
            </div>
            <SegmentedControl
              label="Color the grid by"
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'attend', label: 'Can attend' },
                { value: 'prefer', label: 'Prefer' },
              ]}
            />
          </div>

          <div className={cn('mt-5', poll.dates.length > 7 && '-mx-1 overflow-x-auto px-1 pb-2')}>
            {total === 0 ? (
              <Empty bare icon={<Users size={20} />} title="No responses yet" body="Share the link — the grid fills in as people respond." />
            ) : (
              <GroupHeatmap
                poll={poll}
                result={result}
                mode={mode}
                focusPerson={person}
                highlight={hoverRec}
                onSelect={onChoose}
                cellHeight={desktop ? 20 : 18}
              />
            )}
          </div>

          {total > 0 && <Legend mode={mode} total={total} selectable={!!onChoose} />}
        </div>
      </section>

      {/* recommendations */}
      <section aria-label="Recommended times" className="order-first lg:order-none">
        <SectionLabel right={result.ready ? respondedLabel(result) : undefined}>Top options</SectionLabel>

        <div className="flex flex-col gap-3">
        {!result.ready && (
          <Empty
            icon={<Hourglass size={20} />}
            title="Recommendations appear after 2 responses"
            body={`${result.responded} so far. We need at least two people to compare.`}
          />
        )}

        {/* compact notes are not cards: tinted, 14px radius — a 20px card radius on a
            ~50px-tall strip reads as a pill next to the tall option cards */}
        {result.ready && result.provisional && (
          <div className="flex items-start gap-3 rounded-[14px] bg-accent-soft/60 px-4 py-3 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--color-accent)_14%,transparent)]">
            <Info size={18} className="mt-px shrink-0 text-accent" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-fg-2">
                Still waiting on <span className="font-medium text-fg">{result.pendingNames.join(', ')}</span>. These could change.
              </p>
              {onProceed && (
                <Button size="sm" variant="secondary" className="mt-3" onClick={onProceed}>
                  Decide with {result.responded} responses
                </Button>
              )}
            </div>
          </div>
        )}

        {result.ready && result.noFullCoverage && result.options[0] && (
          <div className="flex items-start gap-3 rounded-[14px] bg-warn px-4 py-3 text-sm text-warn-ink shadow-[inset_0_0_0_1px_var(--color-warn-line)]">
            <Info size={18} strokeWidth={2.25} className="mt-px shrink-0" />
            <p>
              No time works for all {result.responded}. Best coverage:{' '}
              <span className="font-semibold">
                {(() => {
                  const l = windowLabel(poll, result.options[0].day, result.options[0].startSlot, poll.duration)
                  return `${l.weekday} ${l.time}`
                })()}{' '}
                — {result.bestAttendance}/{result.responded}
              </span>
              .
            </p>
          </div>
        )}

        {result.ready &&
          result.options.map((o, i) => (
            <RecommendationCard
              key={o.key}
              poll={poll}
              result={result}
              index={i}
              onHover={setHoverRec}
              active={hoverRec?.key === o.key}
              onChoose={onChoose ? (rec) => onChoose({ day: rec.day, startSlot: rec.startSlot }) : undefined}
            />
          ))}

        {result.moreTied > 0 && (
          <p className="px-1 pt-1 text-xs text-fg-3">
            {result.moreTied} more {result.moreTied === 1 ? 'time ties' : 'times tie'} with the last option. We show ties honestly instead of picking one at random.
          </p>
        )}

        {readOnlyNote && result.ready && <p className="px-1 pt-1 text-sm text-fg-3">{readOnlyNote}</p>}
        </div>
      </section>
    </div>
  )
}

function Legend({ mode, total, selectable }: { mode: HeatMode; total: number; selectable: boolean }) {
  const steps = Array.from({ length: total + 1 }, (_, i) => i)
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed border-line-strong pt-4 text-xs text-fg-3">
      <div className="flex items-center gap-2">
        <span className="tnum">0</span>
        <div className="flex overflow-hidden rounded-[5px] shadow-[0_0_0_1px_var(--color-line)]">
          {steps.map((i) => {
            const r = i / total
            return (
              <span
                key={i}
                className="h-3 w-5"
                style={{
                  background:
                    r === 0
                      ? 'white'
                      : `color-mix(in oklch, var(--color-pref${r === 1 ? '-strong' : ''}) ${r === 1 ? 72 : Math.round(12 + r * 88)}%, white)`,
                }}
              />
            )
          })}
        </div>
        <span className="tnum">{total}</span>
        <span>{mode === 'attend' ? 'people can attend' : 'people prefer'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="grid size-[18px] place-items-center rounded-full bg-ink text-[10px] font-semibold text-white tnum"><span className="glyph">1</span></span>
        Recommended window
      </div>
      <span className="ms-auto hidden text-fg-4 sm:inline">{selectable ? 'Hover to see who can come · click to choose' : 'Hover to see who can come'}</span>
    </div>
  )
}

function Empty({ icon, title, body, bare }: { icon: ReactNode; title: string; body: string; bare?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', !bare && 'card')}>
      <span className="grid size-11 place-items-center rounded-[14px] bg-sunken text-fg-3">{icon}</span>
      <div className="mt-3 text-base font-semibold">{title}</div>
      <p className="mt-1 max-w-[32ch] text-sm text-fg-3">{body}</p>
    </div>
  )
}
