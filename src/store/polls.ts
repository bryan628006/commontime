import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { scoreWindow } from '../lib/rank'
import { buildSamplePolls } from '../lib/seed'
import type { Cells, Duration, Poll, PollResponse } from '../lib/types'

export interface NewPollInput {
  name: string
  note?: string
  organizerName: string
  dates: string[]
  dayStartMin: number
  dayEndMin: number
  duration: Duration
  invitees?: string[]
}

interface PollsState {
  polls: Record<string, Poll>
  createPoll: (input: NewPollInput) => Poll
  upsertResponse: (pollId: string, input: { id?: string; name: string; cells: Cells }) => PollResponse
  confirm: (pollId: string, day: number, startSlot: number) => void
  reopen: (pollId: string) => void
  setProceedEarly: (pollId: string, value: boolean) => void
  resetSample: () => void
}

const rid = (len = 8) => {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('')
}

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)

function isStale(poll: Poll) {
  const last = poll.dates[poll.dates.length - 1]
  const today = new Date().toISOString().slice(0, 10)
  return !last || last < today
}

const samplesById = () => Object.fromEntries(buildSamplePolls().map((p) => [p.id, p]))

export const usePolls = create<PollsState>()(
  persist(
    (set, get) => ({
      polls: samplesById(),

      createPoll: (input) => {
        const id = `${slug(input.name) || 'poll'}-${rid(4)}`
        const poll: Poll = {
          ...input,
          id,
          adminToken: rid(10),
          invitees: input.invitees?.length ? input.invitees : undefined,
          responses: [],
          status: 'open',
          createdAt: Date.now(),
          createdHere: true,
        }
        set((s) => ({ polls: { ...s.polls, [id]: poll } }))
        return poll
      },

      upsertResponse: (pollId, { id, name, cells }) => {
        const poll = get().polls[pollId]
        const existing = poll.responses.find(
          (r) => r.id === id || (!id && r.name.trim().toLowerCase() === name.trim().toLowerCase()),
        )
        const response: PollResponse = {
          id: existing?.id ?? `r-${slug(name) || 'guest'}-${rid(4)}`,
          name: name.trim(),
          cells,
          updatedAt: Date.now(),
        }
        const responses = existing
          ? poll.responses.map((r) => (r.id === existing.id ? response : r))
          : [...poll.responses, response]
        set((s) => ({ polls: { ...s.polls, [pollId]: { ...poll, responses } } }))
        return response
      },

      confirm: (pollId, day, startSlot) => {
        const poll = get().polls[pollId]
        const w = scoreWindow(poll, day, startSlot)
        set((s) => ({
          polls: {
            ...s.polls,
            [pollId]: {
              ...poll,
              status: 'confirmed',
              confirmed: {
                day,
                startSlot,
                at: Date.now(),
                attendeesAtConfirm: w.people.filter((p) => p.state > 0).map((p) => p.responseId),
              },
            },
          },
        }))
      },

      reopen: (pollId) => {
        const poll = get().polls[pollId]
        set((s) => ({ polls: { ...s.polls, [pollId]: { ...poll, status: 'open', confirmed: undefined } } }))
      },

      setProceedEarly: (pollId, value) => {
        const poll = get().polls[pollId]
        set((s) => ({ polls: { ...s.polls, [pollId]: { ...poll, proceedEarly: value } } }))
      },

      resetSample: () => set((s) => ({ polls: { ...s.polls, ...samplesById() } })),
    }),
    {
      name: 'commontime:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ polls: s.polls }),
      // Keep every demo poll present and its dates in the future so the demo never goes stale.
      merge: (persisted, current) => {
        const polls = { ...current.polls, ...((persisted as Partial<PollsState>)?.polls ?? {}) }
        for (const fresh of buildSamplePolls()) {
          if (!polls[fresh.id] || isStale(polls[fresh.id])) polls[fresh.id] = fresh
        }
        return { ...current, polls }
      },
    },
  ),
)

export const usePoll = (id: string | undefined) => usePolls((s) => (id ? s.polls[id] : undefined))
