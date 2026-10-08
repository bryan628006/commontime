/**
 * When2meet-style per-poll password. Never stored in plain text: we keep a SHA-256 of
 * poll + name + password, so the same password on another poll (or name) hashes differently.
 * This is a demo safeguard against casual edits, not real account security.
 */
export async function hashPin(pollId: string, name: string, pin: string) {
  const data = new TextEncoder().encode(`${pollId}:${name.trim().toLowerCase()}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
