import { createAvatar } from '@dicebear/core'
import { notionists } from '@dicebear/collection'

// Pastel grounds, echoing the illustrated avatars in the reference bento.
const GROUNDS = ['ffd8c2', 'c9e7ff', 'd8f5d0', 'f3d6ff', 'fff1b8', 'ffd1dc', 'd6e0ff', 'c8f1ec']

// Only the friendly smiles from notionists' 30 mouths — the rest include tongues,
// "O" mouths, frowns and gritted teeth that read as odd at avatar size.
const LIPS = ['variant03', 'variant17', 'variant22', 'variant23', 'variant25']

const cache = new Map<string, string>()

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function avatarUri(name: string) {
  const seed = name.trim().toLowerCase() || 'guest'
  const hit = cache.get(seed)
  if (hit) return hit
  const uri = createAvatar(notionists, {
    seed,
    backgroundColor: [GROUNDS[hash(seed) % GROUNDS.length]],
    lips: LIPS as never,
    scale: 110,
    translateY: 4,
  }).toDataUri()
  cache.set(seed, uri)
  return uri
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}
