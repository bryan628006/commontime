import { ArrowRight, Check, Link2, Lock, MessageSquareText } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { organizerUrl, participantUrl } from '../../lib/links'
import type { Poll } from '../../lib/types'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { CopyButton } from '../ui/CopyButton'

export function inviteMessage(poll: Poll) {
  return `Help us pick a time for ${poll.name} — mark when you’re free (takes under a minute): ${participantUrl(poll)}`
}

export function ShareCard({ poll, onAddMine, onOpenOrganizer }: { poll: Poll; onAddMine: () => void; onOpenOrganizer: () => void }) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="card mx-auto max-w-[560px] p-6 sm:p-8"
    >
      <motion.div
        initial={reduce ? false : { scale: 0.6, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0.45, delay: 0.1 }}
        className="grid size-14 place-items-center rounded-[18px] bg-pref text-pref-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_24px_-8px_var(--color-pref-strong)]"
      >
        <Check size={28} strokeWidth={2.5} />
      </motion.div>
      <h1 className="mt-5 text-xl font-semibold">Your poll is ready</h1>
      <p className="mt-1 text-base text-fg-2">Share the participant link with the group. Keep the organizer link to yourself.</p>

      <div className="mt-6 flex flex-col gap-3">
        <LinkRow
          icon={<Link2 size={16} strokeWidth={2.5} />}
          title="Participant link"
          hint="Send this to the group."
          url={participantUrl(poll)}
        />
        <LinkRow
          icon={<Lock size={16} strokeWidth={2.5} />}
          title="Organizer link"
          hint="Keep this one — it’s how you see results and confirm the time."
          url={organizerUrl(poll)}
          private
        />
      </div>

      <div className="mt-4">
        <CopyButton
          variant="secondary"
          className="w-full"
          size="lg"
          text={inviteMessage(poll)}
          label="Copy invite message for your group chat"
          copiedLabel="Invite message copied"
          icon={<MessageSquareText size={16} strokeWidth={2.5} />}
        />
      </div>

      <div className="dashed-divider my-6" />

      {/* sharing is this screen's primary job; these are the next steps */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" size="lg" className="flex-1 pe-[18px]" onClick={onAddMine}>
          Add my availability <ArrowRight size={15} strokeWidth={2.5} />
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={onOpenOrganizer}>
          Open organizer view
        </Button>
      </div>
    </motion.section>
  )
}

function LinkRow({ icon, title, hint, url, private: isPrivate }: { icon: ReactNode; title: string; hint: string; url: string; private?: boolean }) {
  return (
    // concentric: panel 18px = field 8px + 10px padding
    <div className="rounded-[18px] bg-sunken p-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
      <div className="flex items-start gap-2 px-1.5 pt-1">
        <span className={cn('mt-px', isPrivate ? 'text-accent' : 'text-fg-2')}>{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <p className="text-xs text-fg-3">{hint}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label={title}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 truncate rounded-[8px] bg-surface px-3 font-mono text-xs text-fg-2 shadow-[0_0_0_1px_var(--color-line-strong)] outline-none"
        />
        <CopyButton size="sm" variant={isPrivate ? 'secondary' : 'primary'} text={url} style={{ borderRadius: 8 }} />
      </div>
    </div>
  )
}
