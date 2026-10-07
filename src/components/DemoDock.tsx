import { Menu } from '@base-ui/react/menu'
import { Calendar, ChevronsUpDown, Crown, House, Plus, Undo2, UserPlus } from 'lucide-react'
import { matchPath, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { organizerPath, participantPath } from '../lib/links'
import { DEMO_ME, SAMPLE_ID, SAMPLE_IDS } from '../lib/seed'
import type { Poll } from '../lib/types'
import { usePolls } from '../store/polls'
import { useSession } from '../store/session'
import { Avatar } from './ui/Avatar'
import { cn } from './ui/cn'

function useCurrentContext() {
  const { pathname } = useLocation()
  const admin = matchPath('/e/:id/admin/:token', pathname)
  const part = matchPath('/e/:id', pathname)
  const id = admin?.params.id ?? part?.params.id
  return { pollId: id, isAdmin: !!admin }
}

function people(poll: Poll) {
  const names = new Map<string, { name: string; responseId?: string }>()
  for (const r of poll.responses) names.set(r.name.toLowerCase(), { name: r.name, responseId: r.id })
  for (const n of poll.invitees ?? []) if (!names.has(n.toLowerCase())) names.set(n.toLowerCase(), { name: n })
  return [...names.values()].filter((p) => p.name.toLowerCase() !== poll.organizerName.toLowerCase())
}

/**
 * Demo chrome, not product UI: lets one person play every role in the PRD story.
 * Switching is instant — it's used constantly, so it never animates (frequency rule).
 */
export function DemoDock({ variant }: { variant: 'floating' | 'inline' }) {
  const navigate = useNavigate()
  const { pollId: routeId, isAdmin } = useCurrentContext()
  const polls = usePolls((s) => s.polls)
  const resetSample = usePolls((s) => s.resetSample)
  const identities = useSession((s) => s.identities)
  const setIdentity = useSession((s) => s.setIdentity)

  const poll = polls[routeId ?? ''] ?? polls[SAMPLE_ID]
  const me = routeId ? identities[routeId] : undefined
  // outside a poll (home, dashboard, create) the demo is seen through Maya
  const currentName = !routeId ? DEMO_ME : isAdmin ? poll.organizerName : me?.name
  const role = !routeId ? 'Demo viewer' : isAdmin ? 'Organizer' : me ? 'Participant' : 'New visitor'

  const goParticipant = (p: { name: string; responseId?: string } | null) => {
    setIdentity(poll.id, p ? { name: p.name, responseId: p.responseId } : null)
    navigate(participantPath(poll))
  }

  const goOrganizer = () => {
    const org = poll.responses.find((r) => r.name.toLowerCase() === poll.organizerName.toLowerCase())
    setIdentity(poll.id, { name: poll.organizerName, responseId: org?.id })
    navigate(organizerPath(poll))
  }

  // concentric: popup 18px = item 12px + 6px padding
  const item =
    'flex h-10 cursor-default items-center gap-2.5 rounded-[12px] px-2 text-sm text-white/85 outline-none select-none data-highlighted:bg-white/10 data-highlighted:text-white'

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'press group flex items-center gap-2 text-left text-white outline-offset-4',
          'bg-[#1a1a1a]/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(0_0_0/0.6),0_12px_32px_-8px_rgb(0_0_0/0.45)] backdrop-blur-xl',
          variant === 'floating'
            ? 'fixed bottom-5 left-1/2 z-40 h-12 -translate-x-1/2 rounded-full py-1.5 pe-3.5 ps-1.5'
            : 'h-9 rounded-full py-1 pe-2 ps-1',
        )}
        aria-label={`Demo: viewing as ${currentName ?? 'nobody'} (${role}). Switch role`}
      >
        {currentName ? (
          <Avatar name={currentName} size={variant === 'floating' ? 'md' : 'sm'} />
        ) : (
          <span className={cn('grid place-items-center rounded-full bg-white/10', variant === 'floating' ? 'size-9' : 'size-7')}>
            <UserPlus size={15} />
          </span>
        )}
        {variant === 'floating' && (
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-white/45 uppercase">Demo · viewing as</span>
            <span className="text-sm font-medium">
              {currentName ?? 'Pick a role'} <span className="text-white/50">· {role}</span>
            </span>
          </span>
        )}
        <ChevronsUpDown size={14} className="ms-1 text-white/50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side={variant === 'floating' ? 'top' : 'bottom'} align={variant === 'floating' ? 'center' : 'end'} sideOffset={10} className="z-50 outline-none">
          <Menu.Popup className="w-[280px] origin-[var(--transform-origin)] rounded-[18px] bg-[#1a1a1a]/95 p-1.5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(0_0_0/0.6),0_24px_48px_-12px_rgb(0_0_0/0.5)] outline-none backdrop-blur-xl transition-[scale,opacity] duration-150 ease-[var(--ease-out)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <div className="px-2 pt-1.5 pb-1 text-[10px] font-semibold tracking-[0.1em] text-white/40 uppercase">{poll.name}</div>
            <Menu.Item className={item} onClick={goOrganizer}>
              <Avatar name={poll.organizerName} size="sm" />
              <span className="flex-1">{poll.organizerName}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#c9c9ff]">
                <Crown size={10} fill="currentColor" /> Organizer
              </span>
            </Menu.Item>
            {people(poll).map((p) => (
              <Menu.Item key={p.name} className={item} onClick={() => goParticipant(p)}>
                <Avatar name={p.name} size="sm" status={p.responseId ? undefined : 'pending'} />
                <span className="flex-1">{p.name}</span>
                <span className="text-[11px] text-white/40">{p.responseId ? 'Responded' : 'Pending'}</span>
              </Menu.Item>
            ))}
            <Menu.Item className={item} onClick={() => goParticipant(null)}>
              <span className="grid size-7 place-items-center rounded-full bg-white/10">
                <UserPlus size={14} />
              </span>
              Someone new
            </Menu.Item>
            <Menu.Separator className="mx-2 my-1.5 h-px bg-white/10" />
            <Menu.Item className={item} onClick={() => navigate('/new')}>
              <Plus size={16} className="mx-1.5" /> Create a new poll
            </Menu.Item>
            <Menu.Item className={item} onClick={() => navigate('/meetings')}>
              <Calendar size={16} className="mx-1.5" /> Meetings
            </Menu.Item>
            <Menu.Item className={item} onClick={() => navigate('/')}>
              <House size={16} className="mx-1.5" /> Home
            </Menu.Item>
            <Menu.Item
              className={item}
              onClick={() => {
                resetSample()
                for (const id of SAMPLE_IDS) setIdentity(id, null)
                toast('Demo data reset', { description: 'All four sample meetings are back to their starting state.' })
              }}
            >
              <Undo2 size={16} className="mx-1.5" /> Reset demo data
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
