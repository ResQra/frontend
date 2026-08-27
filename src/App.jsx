import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpen, ChevronLeft, Home as HomeIcon, LifeBuoy, MapPin, MessageSquare, Siren } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import RequestHelp from './pages/RequestHelp.jsx'
import TrackStatus from './pages/TrackStatus.jsx'
import Chat from './pages/Chat.jsx'
import Guides from './pages/Guides.jsx'
import GuideDetail from './pages/GuideDetail.jsx'
import AdminConsole from './pages/admin/AdminConsole.jsx'
import LandingPage from './pages/LandingPage.jsx'
import JudgeDemoSandbox from './pages/JudgeDemoSandbox.jsx'
import { Toaster } from './components/ui/sonner.jsx'

function BackButton() {
  return (
    <Link
      to="/guides"
      className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      aria-label="Back"
    >
      <ChevronLeft className="size-5" />
    </Link>
  )
}

function Shell({ children, padded = true }) {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const initials = (user?.name || 'R')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const navItems = [
    ['/portal', 'Home', HomeIcon],
    ['/request', 'SOS', Siren],
    ['/track', 'Status', MapPin],
    ['/guides', 'Guides', BookOpen],
    ['/chat', 'Chat', MessageSquare],
  ]

  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <header className="sticky top-0 z-[500] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-white">
              <LifeBuoy className="size-[18px]" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">ResQra</span>
          </Link>
          {user && (
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-sky-100 text-[12px] font-bold text-sky-800">
                {initials}
              </span>
              <button
                onClick={signOut}
                className="text-[13px] font-medium text-slate-500 transition hover:text-slate-900"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto w-full max-w-3xl flex-1 ${padded ? 'px-4 py-5' : ''}`}>{children}</main>

      <nav className="sticky bottom-0 z-[500] border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {navItems.map(([to, label, Icon]) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-sky-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`size-[21px] ${to === '/request' && active ? 'text-red-600' : ''}`} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/portal" replace />
  return children
}

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/portal"
          element={
            <RequireAuth>
              <Shell>
                <Home />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/request"
          element={
            <RequireAuth>
              <Shell>
                <RequestHelp />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/track"
          element={
            <RequireAuth>
              <Shell>
                <TrackStatus />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/guides"
          element={
            <RequireAuth>
              <Shell>
                <Guides />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/guides/:id"
          element={
            <RequireAuth>
              <Shell>
                <GuideDetail />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Shell padded={false}>
                <Chat />
              </Shell>
            </RequireAuth>
          }
        />
        <Route path="/demo" element={<JudgeDemoSandbox />} />
        <Route
          path="/admin"
          element={
            <RequireRole role="coordinator">
              <AdminConsole />
            </RequireRole>
          }
        />
      </Routes>
    </>
  )
}

export { BackButton }
