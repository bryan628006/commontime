import { cn } from './cn'

/** Segmented progress bar — a riff on the "streak tracker" in the references. */
export function ProgressSegments({ value, total, className }: { value: number; total: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
          <span
            className="absolute inset-0 origin-left rounded-full bg-pref transition-transform duration-500 ease-[var(--ease-out)]"
            style={{ transform: `scaleX(${i < value ? 1 : 0})`, transitionDelay: `${i * 40}ms` }}
          />
        </span>
      ))}
    </div>
  )
}
