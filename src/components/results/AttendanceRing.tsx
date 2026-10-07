import { cn } from '../ui/cn'

export function AttendanceRing({ value, total, size = 44, className }: { value: number; total: number; size?: number; className?: string }) {
  const stroke = 3.5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = total ? value / total : 0
  const full = ratio === 1
  return (
    <div
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} of ${total} can attend`}
    >
      {/* ring + label share one grid cell, so the label centres on the ring itself */}
      <svg width={size} height={size} className="col-start-1 row-start-1 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(0 0 0 / 0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={full ? 'var(--color-pref-strong)' : 'var(--color-pref)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }}
        />
      </svg>
      <span className="glyph col-start-1 row-start-1 text-xs font-semibold">
        {value}
        <span className="text-fg-4">/{total}</span>
      </span>
    </div>
  )
}
