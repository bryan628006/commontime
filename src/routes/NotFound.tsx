import { Search } from 'lucide-react'
import { Link } from 'react-router'
import { AppShell } from '../components/AppShell'
import { buttonStyles } from '../components/ui/Button'

export function NotFound({ title = 'We couldn’t find that poll', body = 'The link may be mistyped, or the poll lives in a different browser — this demo stores polls locally.' }: { title?: string; body?: string }) {
  return (
    <AppShell>
      <div className="card mx-auto flex max-w-[440px] flex-col items-center px-8 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-[16px] bg-sunken text-fg-3">
          <Search size={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-1.5 text-sm text-fg-3">{body}</p>
        <div className="mt-6 flex gap-2">
          <Link to="/" className={buttonStyles({ variant: 'secondary' })}>
            Home
          </Link>
          <Link to="/new" className={buttonStyles({ variant: 'primary' })}>
            Create a poll
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
