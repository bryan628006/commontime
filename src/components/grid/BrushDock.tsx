import { Check, Eraser, Star, Undo2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../ui/cn'
import type { Brush } from './usePaintState'

export const BRUSHES: { value: Brush; label: string; short: string; key: string }[] = [
  { value: 2, label: 'Preferred', short: 'Preferred', key: '1' },
  { value: 1, label: 'Works', short: 'Works', key: '2' },
  { value: 0, label: 'Erase', short: 'Erase', key: '3' },
]

export function BrushSwatch({ brush, size = 22, className }: { brush: Brush; size?: number; className?: string }) {
  const icon = Math.round(size * 0.58)
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-[7px]',
        brush === 2 && 'bg-pref text-pref-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_var(--color-pref-strong)]',
        brush === 1 && 'hatch text-works-ink shadow-[0_0_0_1px_var(--color-works-line)]',
        brush === 0 && 'bg-surface text-fg-3 shadow-[0_0_0_1px_var(--color-line-strong)]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {brush === 2 && <Star fill="currentColor" size={icon} />}
      {brush === 1 && <Check strokeWidth={2.5} size={icon} />}
      {brush === 0 && <Eraser strokeWidth={2.5} size={icon} />}
    </span>
  )
}

export function BrushDock({
  brush,
  onBrush,
  onUndo,
  canUndo,
  compact,
  className,
}: {
  brush: Brush
  onBrush: (b: Brush) => void
  onUndo: () => void
  canUndo: boolean
  compact?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div role="radiogroup" aria-label="Brush" className="flex flex-1 gap-1 rounded-[14px] bg-black/[0.045] p-1">
        {BRUSHES.map((b) => {
          const active = b.value === brush
          return (
            <button
              key={b.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-keyshortcuts={b.key}
              onClick={() => onBrush(b.value)}
              className={cn(
                'press relative flex flex-1 items-center justify-center gap-2 rounded-[10px] font-medium',
                compact ? 'h-11 px-2 text-sm' : 'h-10 px-3 text-sm',
                active ? 'text-fg' : 'text-fg-2 hover:text-fg',
              )}
            >
              {active && (
                <motion.span
                  layoutId="brush-pill"
                  className="absolute inset-0 rounded-[10px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_10px_-4px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.04)]"
                  transition={{ type: 'spring', duration: 0.38, bounce: 0.18 }}
                />
              )}
              <motion.span
                className="relative z-10"
                key={active ? 'on' : 'off'}
                initial={active && !reduce ? { rotate: -14, scale: 0.9 } : false}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.55 }}
              >
                <BrushSwatch brush={b.value} size={compact ? 20 : 22} />
              </motion.span>
              <span className="relative z-10">{b.short}</span>
              {!compact && (
                <kbd className="relative z-10 ms-auto hidden h-[18px] min-w-[18px] place-items-center rounded-[5px] px-1 font-sans text-2xs font-medium text-fg-3 shadow-[0_0_0_1px_var(--color-line-strong)] lg:grid">
                  <span className="glyph">{b.key}</span>
                </kbd>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last stroke"
        aria-keyshortcuts="Control+Z Meta+Z"
        title="Undo (Ctrl/⌘ Z)"
        className={cn(
          // same height + radius as the dock beside it (h-10/11 pill + 2×4px padding)
          'press grid shrink-0 place-items-center rounded-[14px] bg-surface text-fg-2 shadow-button transition-[opacity,color] hover:text-fg disabled:opacity-40',
          compact ? 'size-[52px]' : 'size-12',
        )}
      >
        <Undo2 size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}
