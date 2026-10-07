import { rankPoll, type RankResult } from './rank'
import { DEMO_ME } from './seed'
import type { Poll, PollResponse } from './types'
import type { Identity } from '../store/session'

export type MeetingStatus = 'needs-availability' | 'ready' | 'collecting' | 'waiting' | 'confirmed'
export type MeetingGroup = 'needs' | 'progress' | 'confirmed'

export interface MeetingView {
  poll: Poll
  /** who "you" are on this poll in the demo */
  me: string
  role: 'organizer' | 'participant'
  myResponse?: PollResponse
  result: RankResult
  status: MeetingStatus
  group: MeetingGroup
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The dashboard is seen through one person. A role picked in the demo dock wins;
 * polls created in this browser are yours to organize; everything else is Maya's view.
 */
export function viewerName(poll: Poll, identity?: Identity) {
  if (identity?.name) return identity.name
  if (poll.createdHere) return poll.organizerName
  return DEMO_ME
}

export function meetingView(poll: Poll, identity?: Identity): MeetingView {
  const me = viewerName(poll, identity)
  const role = same(me, poll.organizerName) ? 'organizer' : 'participant'
  const myResponse = poll.responses.find((r) => r.id === identity?.responseId) ?? poll.responses.find((r) => same(r.name, me))
  const result = rankPoll(poll)

  let status: MeetingStatus
  if (poll.status === 'confirmed') status = 'confirmed'
  else if (role === 'participant' && !myResponse) status = 'needs-availability'
  else if (role === 'organizer' && result.ready && !result.provisional) status = 'ready'
  else if (role === 'organizer') status = 'collecting'
  else status = 'waiting'

  const group: MeetingGroup =
    status === 'confirmed' ? 'confirmed' : status === 'needs-availability' || status === 'ready' ? 'needs' : 'progress'

  return { poll, me, role, myResponse, result, status, group }
}

export const GROUPS: { id: MeetingGroup; label: string }[] = [
  { id: 'needs', label: 'Needs you' },
  { id: 'progress', label: 'In progress' },
  { id: 'confirmed', label: 'Confirmed' },
]
