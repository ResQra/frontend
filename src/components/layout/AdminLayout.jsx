import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { AppSidebar } from './AppSidebar.jsx'
import AreaSelector from '../AreaSelector.jsx'
import { Badge } from '../ui/badge.jsx'
import { Button } from '../ui/button.jsx'

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
  onOpenDemo,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Collapsible Sidebar */}
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
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-black/90 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* DEFCON Threat Pill */}
            <Badge variant="default" className="gap-1.5 bg-white text-black font-bold">
              <span className="size-1.5 rounded-full bg-black animate-pulse" />
              DEFCON 1: ACTIVE FLOOD
            </Badge>

            {/* Live WebSocket Status */}
            <div className="hidden sm:flex items-center gap-1.5 rounded bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-800">
              <span className={`size-1.5 rounded-full ${wsConnected ? 'bg-white' : 'bg-zinc-600'}`} />
              <span>{wsConnected ? 'STREAM ACTIVE' : 'POLLING'}</span>
            </div>
          </div>

          {/* Region Switcher & Global Context */}
          <div className="flex items-center gap-2">
            <Link to="/demo">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-zinc-700 bg-zinc-900 px-2.5 text-xs font-bold text-white hover:bg-zinc-800 shadow-xs"
              >
                <Zap className="size-3.5 fill-yellow-400 text-yellow-400" />
                <span className="hidden sm:inline">Guided Demo</span>
                <span className="sm:hidden">Demo</span>
              </Button>
            </Link>
            <AreaSelector value={area} onChange={onAreaChange} />
          </div>
        </header>

        {/* Dynamic Page View Body */}
        <main className="flex-1 p-3 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
