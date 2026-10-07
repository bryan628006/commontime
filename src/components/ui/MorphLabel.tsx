import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Swaps a label in place, bridging the two states with a 2px blur so it reads as one morph. */
export function MorphLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={id}
        className="inline-flex items-center gap-1.5"
        initial={{ opacity: 0, filter: 'blur(2px)', y: 4 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        exit={{ opacity: 0, filter: 'blur(2px)', y: -4, transition: { duration: 0.12 } }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}
