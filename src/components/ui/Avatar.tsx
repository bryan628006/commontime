import { Check, Star, X } from 'lucide-react'
import { avatarUri } from '../../lib/avatar'
import type { Pref } from '../../lib/types'
import { cn } from './cn'

export type AvatarStatus = 'preferred' | 'works' | 'unavailable' | 'pending' | undefined

const sizes = { xs: 20, sm: 28, md: 36, lg: 48, xl: 64 } as const

export function prefToStatus(p: Pref): AvatarStatus {
  return p === 2 ? 'preferred' : p === 1 ? 'works' : 'unavailable'
}

export function Avatar({
  name,
  size = 'md',
  status,
  className,
  title,
}: {
  name: string
  size?: keyof typeof sizes
  status?: AvatarStatus
  className?: string
  title?: string
}) {
  const px = sizes[size]
  const badge = Math.max(12, Math.round(px * 0.42))
  return (
    <span
      className={cn('relative inline-flex shrink-0 rounded-full', className)}
      style={{ width: px, height: px }}
      title={title}
    >
      <img
        src={avatarUri(name)}
        alt=""
        width={px}
        height={px}
        draggable={false}
        className={cn(
          'size-full rounded-full bg-sunken object-cover',
          status === 'unavailable' && 'opacity-45 grayscale',
          status === 'pending' && 'opacity-60',
        )}
      />
      {/* ring encodes state with shape, not just colour */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-[2px] rounded-full',
          !status && 'ring-2 ring-surface',
          status === 'preferred' && 'ring-2 ring-pref',
          status === 'works' && 'border-2 border-dashed border-works-line',
          status === 'unavailable' && 'ring-2 ring-surface',
          status === 'pending' && 'animate-breathe border-[1.5px] border-dashed border-fg-4',
        )}
      />
      {status && status !== 'pending' && px >= 28 && (
        <span
          aria-hidden
          className={cn(
            'absolute -right-1 -bottom-1 grid place-items-center rounded-full ring-2 ring-surface',
            status === 'preferred' && 'bg-pref text-pref-ink',
            status === 'works' && 'hatch text-works-ink',
            status === 'unavailable' && 'bg-fg-4 text-white',
          )}
          style={{ width: badge, height: badge }}
        >
          {status === 'preferred' && <Star fill="currentColor" size={badge * 0.62} />}
          {status === 'works' && <Check strokeWidth={2.5} size={badge * 0.62} />}
          {status === 'unavailable' && <X strokeWidth={2.5} size={badge * 0.56} />}
        </span>
      )}
    </span>
  )
}

export function AvatarStack({
  names,
  size = 'sm',
  max = 5,
  className,
}: {
  names: string[]
  size?: keyof typeof sizes
  max?: number
  className?: string
}) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((n, i) => (
        <Avatar key={n + i} name={n} size={size} className={cn(i > 0 && '-ms-2')} title={n} />
      ))}
      {rest > 0 && (
        <span
          className="-ms-2 grid place-items-center rounded-full bg-sunken text-2xs font-semibold text-fg-2 ring-2 ring-surface tnum"
          style={{ width: sizes[size], height: sizes[size] }}
        >
          <span className="glyph">+{rest}</span>
        </span>
      )}
    </div>
  )
}
