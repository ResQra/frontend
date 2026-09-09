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
    ['/track', 'Status', MapPin],
    ['/request', 'SOS', Siren],
    ['/guides', 'Guides', BookOpen],
    ['/chat', 'Chat', MessageSquare],
  ]

  return (
    <div className="app-bg flex min-h-svh flex-col">
      <header className="sticky top-0 z-[500] border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="brand-mark grid size-8 place-items-center rounded-xl text-white shadow-sm">
              <LifeBuoy className="size-[18px]" />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-slate-900">ResQra</span>
            <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 sm:inline">
              FLOOD RESPONSE
            </span>
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

      <nav className="sticky bottom-0 z-[500] border-t border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(([to, label, Icon]) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            if (to === '/request') {
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label="Emergency SOS"
                  className="relative flex flex-col items-center"
                >
                  <span className={`brand-mark-sos -mt-6 grid size-14 place-items-center rounded-full border-4 border-slate-50 text-white transition active:scale-95 ${active ? 'ring-4 ring-red-100' : ''}`}>
                    <Icon className="size-6" strokeWidth={2.4} />
                  </span>
                  <span className={`pb-2 pt-1 text-[11px] font-bold ${active ? 'text-red-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </Link>
              )
            }
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className={`grid size-9 place-items-center rounded-xl transition ${active ? 'bg-slate-900 text-white shadow-md' : ''}`}>
                  <Icon className="size-[21px]" strokeWidth={active ? 2.2 : 1.8} />
                </span>
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
  if ((user.role || '').toLowerCase() !== role.toLowerCase()) return <Navigate to="/portal" replace />
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
        <Route
          path="/admin"
          element={
            <RequireRole role="coordinator">
              <AdminConsole />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export { BackButton }
