import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AppSidebar } from './AppSidebar.jsx'
import AreaSelector from '../AreaSelector.jsx'

export function AdminLayout({
  currentView,
  onViewChange,
  area,
  onAreaChange,
  onOpenCommand,
  onRefresh,
  busy,
  user,
  onSignOut,
  wsConnected,
  lastUpdate,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const secsAgo = lastUpdate ? Math.max(0, Math.round((Date.now() - lastUpdate) / 1000)) : null

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Collapsible Sidebar (drawer on mobile) */}
      <AppSidebar
        currentView={currentView}
        onViewChange={onViewChange}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onOpenCommand={onOpenCommand}
        onRefresh={onRefresh}
        busy={busy}
        user={user}
        onSignOut={onSignOut}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar — TailAdmin-style: white, bordered, shadow */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileNav(true)}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>
            {/* DEFCON Threat Pill */}
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-2.5 sm:px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              <span className="hidden min-[480px]:inline">DEFCON 1 · ACTIVE FLOOD</span>
              <span className="min-[480px]:hidden">D1</span>
            </span>

            {/* Live WebSocket Status */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-medium text-slate-600 border border-slate-200">
              <span className={`size-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{wsConnected ? 'LIVE STREAM' : 'POLLING 8s'}</span>
              {secsAgo != null && <span className="text-slate-400">· {secsAgo}s ago</span>}
            </div>

            {/* ⌘K search trigger */}
            <button
              onClick={onOpenCommand}
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-800 transition min-w-[220px]"
            >
              <span className="text-slate-400">Search incidents, teams…</span>
              <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">⌘K</kbd>
            </button>
          </div>

          {/* Region Switcher — demo lives in separate demo-client per arch §3 */}
          <div className="flex items-center gap-3">
            <AreaSelector value={area} onChange={onAreaChange} />
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-1 pr-3 py-1">
              <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {(user?.name || 'C').slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs font-medium text-slate-700 max-w-[140px] truncate">{user?.name || 'Coordinator'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page View Body */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-y-auto">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
