import { Check, Copy } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from './Button'

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback for insecure contexts
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** Copy → ✓ Copied. The swap crossfades through a 2px blur so it reads as one morphing label. */
export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  toastMessage,
  icon,
  ...props
}: Omit<ButtonProps, 'onClick'> & {
  text: string
  label?: ReactNode
  copiedLabel?: ReactNode
  toastMessage?: string
  icon?: ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <Button
      {...props}
      onClick={async () => {
        const ok = await copyText(text)
        if (!ok) return toast.error('Couldn’t copy — select the text instead.')
        setCopied(true)
        if (toastMessage) toast.success(toastMessage)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1800)
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? 'done' : 'idle'}
          className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, filter: 'blur(2px)', scale: 0.96 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, filter: 'blur(2px)', scale: 0.96, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {copied ? <Check strokeWidth={2.5} size={15} /> : (icon ?? <Copy size={15} />)}
          {copied ? copiedLabel : label}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
