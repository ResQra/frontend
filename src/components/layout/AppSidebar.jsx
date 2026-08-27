import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Flame,
  FlaskConical,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Scale,
  Ship,
  TrendingUp,
  Users,
} from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { Button } from '../ui/button.jsx'

export function AppSidebar({
  currentView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  onOpenCommand,
  onRefresh,
  busy,
  user,
  onSignOut,
}) {
  const navGroups = [
    {
      title: 'Operations',
      items: [
        { id: 'global_monitor', label: 'Global Monitor', icon: Globe, badge: 'LIVE' },
        { id: 'dispatch', label: 'Tactical Map', icon: Radio },
        { id: 'benchmark', label: 'Agent Benchmark', icon: Scale, badge: 'v1.0' },
        { id: 'agents', label: 'Agent Fleet', icon: Cpu, badge: '4+2' },
        { id: 'kpis', label: 'Analytics & KPIs', icon: TrendingUp },
      ],
    },
    {
      title: 'Fleet & Signals',
      items: [
        { id: 'teams', label: 'Rescue Fleet', icon: ShieldCheck },
        { id: 'people', label: 'Citizen Signals', icon: Users },
        { id: 'advisories', label: 'Bulletins', icon: Megaphone },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen shrink-0 border-r border-zinc-800 bg-[#09090b] flex flex-col justify-between transition-all duration-300 z-40 select-none font-sans',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Top Brand & DEFCON Header */}
      <div>
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-7 shrink-0 place-items-center rounded bg-white font-mono text-xs font-black text-black shadow">
              RQ
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-mono text-xs font-black tracking-widest text-white truncate">
                  RESQRA
                </div>
                <div className="font-mono text-[9px] text-zinc-500">
                  COMMAND OPS
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="grid size-6 place-items-center rounded border border-zinc-800 bg-black text-zinc-400 hover:text-white transition"
          >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>

        {/* Quick Search ⌘K Trigger */}
        <div className="p-2.5 border-b border-zinc-800/80">
          <button
            onClick={onOpenCommand}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-black px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition font-mono',
              collapsed && 'justify-center px-0'
            )}
          >
            <Search className="size-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-[11px]">Quick Jump...</span>
                <kbd className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation Item Groups */}
        <nav className="p-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = currentView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer',
                        active
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.2 font-mono text-[9px] font-bold',
                            active
                              ? 'bg-black text-white'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer User Profile & System Controls */}
      <div className="border-t border-zinc-800 p-2.5 space-y-2 bg-black/60">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onRefresh}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 font-mono text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
          >
            <RefreshCw className={cn('size-3', busy && 'animate-spin text-white')} />
            {!collapsed && <span className="text-[10px]">SYNC</span>}
          </button>

          <button
            onClick={onSignOut}
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white transition"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>

        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-2 border border-zinc-900 font-mono text-[10px]">
            <div className="size-2 rounded-full bg-white animate-pulse" />
            <span className="truncate text-zinc-400">{user?.name || 'Coord_01'}</span>
          </div>
        )}
      </div>
    </aside>
  )
}
