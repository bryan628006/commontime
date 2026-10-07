import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

/** Centered modal. Scales from .96 + fades (never from 0); exit is faster than entry. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={cn(
            'fixed inset-0 z-50 min-h-dvh bg-[rgb(20_20_20/0.28)] backdrop-blur-[3px]',
            'transition-opacity duration-200 ease-out data-ending-style:duration-150',
            'data-starting-style:opacity-0 data-ending-style:opacity-0',
          )}
        />
        <BaseDialog.Popup
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2',
            'rounded-[24px] bg-surface p-2 shadow-pop outline-none',
            'transition-[scale,opacity] duration-200 ease-[var(--ease-out)] data-ending-style:duration-150',
            'data-starting-style:scale-[0.96] data-starting-style:opacity-0',
            'data-ending-style:scale-[0.98] data-ending-style:opacity-0',
            className,
          )}
        >
          {/* 8px frame: popup padding 8 + header inset 16 → text sits 24px from the edge */}
          <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-4">
            <div className="min-w-0">
              <BaseDialog.Title className="text-lg font-semibold">{title}</BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="mt-1 text-base text-fg-2">{description}</BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close
              aria-label="Close"
              className="press -mt-1 -me-1 grid size-8 shrink-0 place-items-center rounded-full text-fg-3 transition-colors hover:bg-black/5 hover:text-fg"
            >
              <X size={16} />
            </BaseDialog.Close>
          </div>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

export const DialogClose = BaseDialog.Close
