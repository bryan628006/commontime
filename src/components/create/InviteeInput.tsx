import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Avatar } from '../ui/Avatar'

export const MAX_PEOPLE = 10

/** Token input — Enter or comma adds a person; Backspace on empty removes the last. */
export function InviteeInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const full = value.length >= MAX_PEOPLE

  const add = (raw: string) => {
    const names = raw
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean)
    if (!names.length) return
    const next = [...value]
    for (const n of names) {
      if (next.length >= MAX_PEOPLE) break
      if (!next.some((x) => x.toLowerCase() === n.toLowerCase())) next.push(n.slice(0, 40))
    }
    onChange(next)
    setDraft('')
  }

  return (
    <div>
      <div
        // concentric: field 14px = chip 8px + 6px padding; empty height 44px like every other input
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[14px] bg-surface p-1.5 shadow-[0_0_0_1px_var(--color-line-strong)] transition-shadow focus-within:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)]"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {value.map((n) => (
            <motion.span
              layout
              key={n}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.3 }}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-sunken ps-1 pe-1 text-sm shadow-[0_0_0_1px_var(--color-line)]"
            >
              <Avatar name={n} size="xs" />
              {n}
              <button
                type="button"
                aria-label={`Remove ${n}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(value.filter((x) => x !== n))
                }}
                className="press grid size-6 place-items-center rounded-[4px] text-fg-3 hover:bg-black/5 hover:text-fg"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          value={draft}
          disabled={full}
          aria-label="Add a participant name"
          placeholder={full ? 'That’s the max for now' : value.length ? 'Add another…' : 'Type a name, press Enter'}
          onChange={(e) => {
            const v = e.target.value
            if (v.includes(',')) add(v)
            else setDraft(v)
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (/[,\n]/.test(text)) {
              e.preventDefault()
              add(text)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => add(draft)}
          className="h-8 min-w-[140px] flex-1 bg-transparent px-2 text-base outline-none placeholder:text-fg-4"
        />
      </div>
      <p className="mt-2 text-xs text-fg-3">
        Lets you see who&rsquo;s still pending. CommonTime never messages anyone — you share the link yourself.{' '}
        <span className="tnum">
          {value.length}/{MAX_PEOPLE}
        </span>
      </p>
    </div>
  )
}
