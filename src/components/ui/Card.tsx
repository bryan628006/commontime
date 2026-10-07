import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...props} />
}

/** Small uppercase label used at the top of card sections, like "RECEIVER INFO" in the references. */
export function Eyebrow({ children, className, right }: { children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3">{children}</span>
      {right}
    </div>
  )
}

/**
 * Label row that sits *above* a card or card stack. Fixed 24px height + 12px gap so that
 * side-by-side columns always start their cards on the same line.
 */
export function SectionLabel({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex h-6 items-center justify-between gap-3 px-1', className)}>
      <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3">{children}</span>
      {right && <span className="min-w-0 truncate text-xs text-fg-3">{right}</span>}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div role="presentation" className={cn('dashed-divider', className)} />
}
