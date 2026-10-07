import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

const COLORS = [
  'var(--color-pref)',
  'var(--color-pref-strong)',
  'var(--color-works-line)',
  '#c9e7ff',
  '#f3d6ff',
  '#fff1b8',
  'var(--color-accent)',
]

/** One-time burst of little "time tiles" — rare moment, so it's allowed some delight. */
export function Celebration({ count = 22, delay = 0 }: { count?: number; delay?: number }) {
  const reduce = useReducedMotion()
  // deterministic scatter — looks random, renders the same every time
  const rand = (i: number, salt: number) => {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const tiles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rand(i, 1) * 0.4
        const dist = 70 + rand(i, 2) * 90
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
          fall: 40 + rand(i, 3) * 40,
          rotate: (rand(i, 4) - 0.5) * 240,
          size: 7 + rand(i, 5) * 7,
          color: COLORS[i % COLORS.length],
          delay: rand(i, 6) * 0.08,
          hatch: i % 5 === 0,
        }
      }),
    [count],
  )
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-20">
      {tiles.map((t, i) => (
        <motion.span
          key={i}
          className={t.hatch ? 'hatch absolute rounded-[3px]' : 'absolute rounded-[3px]'}
          style={{ width: t.size, height: t.size * 0.8, background: t.hatch ? undefined : t.color, left: -t.size / 2, top: -t.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 0, rotate: 0 }}
          animate={{
            x: [0, t.x, t.x * 1.08],
            y: [0, t.y, t.y + t.fall],
            rotate: t.rotate,
            scale: [0.6, 1, 0.9],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.1, delay: delay + t.delay, ease: [0.23, 1, 0.32, 1], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  )
}
