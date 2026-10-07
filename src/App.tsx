import { LucideProvider } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { Create } from './routes/Create'
import { Home } from './routes/Home'
import { Meetings } from './routes/Meetings'
import { NotFound } from './routes/NotFound'
import { Organizer } from './routes/Organizer'
import { Participant } from './routes/Participant'
import { BASE } from './lib/links'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    // 1.75px default stroke sits between Lucide's 2px and regular-weight text;
    // icons beside semibold text opt into 2.5 explicitly
    <LucideProvider strokeWidth={1.75}>
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={BASE || undefined}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/new" element={<Create />} />
          <Route path="/e/:id" element={<Participant />} />
          <Route path="/e/:id/admin/:token" element={<Organizer />} />
          <Route path="*" element={<NotFound title="Page not found" body="That page doesn’t exist." />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        offset={72}
        toastOptions={{
          classNames: {
            toast: '!rounded-[14px] !border-0 !shadow-pop !font-sans !text-sm !bg-surface !text-fg',
            description: '!text-fg-3',
          },
        }}
      />
    </MotionConfig>
    </LucideProvider>
  )
}
