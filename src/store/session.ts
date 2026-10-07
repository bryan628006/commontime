import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Who "you" are on each poll. No accounts — identity lives in this browser,
 * which is exactly how the PRD's no-login response flow behaves.
 */
export interface Identity {
  name: string
  responseId?: string
}

interface SessionState {
  identities: Record<string, Identity>
  setIdentity: (pollId: string, identity: Identity | null) => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      identities: {},
      setIdentity: (pollId, identity) =>
        set((s) => {
          const identities = { ...s.identities }
          if (identity) identities[pollId] = identity
          else delete identities[pollId]
          return { identities }
        }),
    }),
    { name: 'commontime:session', storage: createJSONStorage(() => localStorage) },
  ),
)

export const useIdentity = (pollId: string | undefined) =>
  useSession((s) => (pollId ? s.identities[pollId] : undefined))
