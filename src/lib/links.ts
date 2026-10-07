import type { Poll } from './types'

export const participantPath = (poll: Pick<Poll, 'id'>) => `/e/${poll.id}`
export const organizerPath = (poll: Pick<Poll, 'id' | 'adminToken'>) => `/e/${poll.id}/admin/${poll.adminToken}`

/** '' at the site root, '/commontime' on GitHub Pages — no trailing slash */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const origin = () => (typeof window === 'undefined' ? '' : window.location.origin)
export const participantUrl = (poll: Pick<Poll, 'id'>) => origin() + BASE + participantPath(poll)
export const organizerUrl = (poll: Pick<Poll, 'id' | 'adminToken'>) => origin() + BASE + organizerPath(poll)
