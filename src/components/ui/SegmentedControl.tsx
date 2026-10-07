import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { cn } from './cn'

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  /** accessible label when `label` is an icon */
  aria?: string
}

/** Segmented control with a spring-sliding pill (the "Subjects / Chapters" tabs in the references). */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  label,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
  label: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('relative flex rounded-[12px] bg-black/[0.045] p-1', className)}
      onKeyDown={(e) => {
        const i = options.findIndex((o) => o.value === value)
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          onChange(options[(i + 1) % options.length].value)
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          onChange(options[(i - 1 + options.length) % options.length].value)
        }
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.aria}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 rounded-[8px] font-medium whitespace-nowrap transition-colors duration-150 tnum',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              active ? 'text-fg' : 'text-fg-3 hover:text-fg-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)]"
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
