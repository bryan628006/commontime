import { ChevronRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useIsDesktop } from '../lib/hooks'
import { DemoDock } from './DemoDock'
import { Logo, LogoMark } from './Logo'
import { cn } from './ui/cn'

export interface Crumb {
  label: ReactNode
  to?: string
}

export function AppShell({
  crumbs = [],
  badge,
  right,
  children,
  wide,
}: {
  crumbs?: Crumb[]
  badge?: ReactNode
  right?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  const desktop = useIsDesktop()
  const hasCrumbs = crumbs.length > 0
  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 [padding-top:env(safe-area-inset-top)]">
        {/* every item is a flex box (no inline boxes → no baseline strut), so the mark,
            wordmark, carets and crumbs all centre on the same line */}
        <div className={cn('mx-auto flex h-14 items-center gap-2 px-4 sm:px-6', wide ? 'max-w-[1240px]' : 'max-w-[1080px]')}>
          <Link to="/" className="press -ms-1 flex shrink-0 items-center rounded-[10px] p-1" aria-label="CommonTime home">
            {hasCrumbs ? (
              <>
                <span className="flex sm:hidden">
                  <LogoMark />
                </span>
                <span className="hidden sm:flex">
                  <Logo />
                </span>
              </>
            ) : (
              <Logo />
            )}
          </Link>
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              <ChevronRight size={12} strokeWidth={2.5} className="block shrink-0 text-fg-4" aria-hidden />
              {c.to ? (
                <Link
                  to={c.to}
                  className="press flex h-7 shrink-0 items-center rounded-[8px] px-1.5 text-base leading-5 text-fg-2 transition-colors hover:bg-black/[0.04] hover:text-fg"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="min-w-0 truncate px-1.5 text-base leading-5 font-medium">{c.label}</span>
              )}
            </Fragment>
          ))}
          {badge}
          <div className="ms-auto flex shrink-0 items-center gap-2">
            {right}
            {!desktop && <DemoDock variant="inline" />}
          </div>
        </div>
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      </header>
      <main className={cn('mx-auto px-4 pt-6 sm:px-6 sm:pt-8', wide ? 'max-w-[1240px]' : 'max-w-[1080px]')}>{children}</main>
      {desktop && <DemoDock variant="floating" />}
    </div>
  )
}
