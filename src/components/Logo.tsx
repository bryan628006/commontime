import { cn } from './ui/cn'

/** Two overlapping time blocks — the overlap is the "common" time. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    // `block` — an inline SVG sits on the text baseline and picks up descender space
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn('block shrink-0', className)}>
      <rect x="3" y="3" width="17" height="17" rx="5" fill="var(--color-ink)" />
      <rect x="12" y="12" width="17" height="17" rx="5" fill="var(--color-pref)" />
      <path d="M12 17a5 5 0 0 1 5-5h3v3a5 5 0 0 1-5 5h-3v-3Z" fill="var(--color-pref-ink)" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-md leading-6 font-semibold tracking-[-0.02em]">CommonTime</span>
    </span>
  )
}
