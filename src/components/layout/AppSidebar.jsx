import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  FlaskConical,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Ship,
  TrendingUp,
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
  mobileOpen,
  onCloseMobile,
}) {
  const navGroups = [
    {
      title: 'Command',
      items: [
        { id: 'dispatch', label: 'Tactical Map', icon: Radio, desc: 'Queue + live map + gate' },
        { id: 'chat', label: 'AI Copilot', icon: MessageSquare, badge: 'AI', desc: 'Grounded ops Q&A' },
        { id: 'godeyes', label: 'God Eyes 3D', icon: Eye, badge: 'NPL', desc: 'Globe + terrain' },
        { id: 'kpis', label: 'Analytics', icon: TrendingUp, desc: 'KPIs + charts' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { id: 'teams', label: 'Rescue Fleet', icon: ShieldCheck, desc: 'Roster + readiness' },
        { id: 'advisories', label: 'Bulletins', icon: Megaphone, desc: 'Public advisories' },
      ],
    },
  ]

  const expanded = mobileOpen || !collapsed

  function go(id) {
    onViewChange(id)
    onCloseMobile?.()
  }

  return (
    <>
    {mobileOpen && (
      <div
        className="fixed inset-0 z-[1295] bg-slate-900/50 lg:hidden"
        onClick={() => onCloseMobile?.()}
        aria-hidden
      />
    )}
    <aside
      className={cn(
        'h-screen shrink-0 border-r border-slate-200 bg-white flex-col justify-between transition-all duration-300 z-[1300] select-none font-sans shadow-[1px_0_2px_rgba(15,23,42,0.04)]',
        mobileOpen
          ? 'flex fixed inset-y-0 left-0 w-[264px]'
          : 'hidden',
        'lg:flex lg:sticky lg:top-0',
        collapsed && !mobileOpen ? 'lg:w-[76px]' : 'lg:w-[264px]'
      )}
    >
      {/* Brand */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 font-mono text-xs font-black text-white shadow-sm">
              RQ
            </span>
            {expanded && (
              <div className="min-w-0">
                <div className="text-[15px] font-extrabold tracking-tight text-slate-900 leading-none truncate">
                  ResQra
                </div>
                <div className="mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Command Ops · Rautahat
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-300 transition"
            title={(collapsed && !mobileOpen) ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {(collapsed && !mobileOpen) ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Quick Search ⌘K Trigger */}
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={onOpenCommand}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-800 transition shadow-sm',
              (collapsed && !mobileOpen) && 'justify-center px-0'
            )}
          >
            <Search className="size-4 shrink-0" />
            {expanded && (
              <>
                <span className="flex-1 text-left">Quick jump…</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation Item Groups */}
        <nav className="p-3 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {expanded && (
                <div className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = currentView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.id)}
                      title={(collapsed && !mobileOpen) ? `${item.label} — ${item.desc}` : item.desc}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition cursor-pointer border',
                        active
                          ? 'bg-slate-900 text-white font-semibold shadow-md border-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent hover:border-slate-200',
                        (collapsed && !mobileOpen) && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('size-[18px] shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')} />
                      {expanded && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {expanded && item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide',
                            active
                              ? 'bg-white/15 text-white'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
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
      <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 font-mono text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition"
          >
            <RefreshCw className={cn('size-3.5', busy && 'animate-spin')} />
            {expanded && <span>SYNC</span>}
          </button>

          <button
            onClick={onSignOut}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 transition shadow-sm"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>

        {expanded && (
          <div className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 border border-slate-200 shadow-sm">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-900">{user?.name || 'Duty Coordinator'}</div>
              <div className="font-mono text-[10px] text-slate-400">ON SHIFT · Rautahat EOC</div>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
