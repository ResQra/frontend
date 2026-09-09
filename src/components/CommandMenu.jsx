import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Eye,
  Layers,
  MapPin,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Ship,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command.jsx'

export function CommandMenu({
  open,
  onOpenChange,
  incidents = [],
  teams = [],
  onSelectIncident,
  onSelectTeam,
  onTriggerSweep,
  onRecomputeRisk,
  onNavigateTab,
}) {
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search incidents, teams, agent triggers (⌘K)..." />
      <CommandList>
        <CommandEmpty>No matching records found.</CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Command Views">
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('dispatch')
              onOpenChange(false)
            }}
          >
            <Radio className="mr-2 size-4 text-slate-500" />
            <span>Tactical Map Cockpit</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('godeyes')
              onOpenChange(false)
            }}
          >
            <Eye className="mr-2 size-4 text-slate-500" />
            <span>God Eyes — Nepal Sector</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('chat')
              onOpenChange(false)
            }}
          >
            <MessageSquare className="mr-2 size-4 text-slate-500" />
            <span>AI Chat Sessions</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('teams')
              onOpenChange(false)
            }}
          >
            <Ship className="mr-2 size-4 text-slate-500" />
            <span>Rescue Fleet Directory</span>
          </CommandItem>
          <CommandItem
            value="operational analytics kpis charts"
            onSelect={() => {
              onNavigateTab?.('kpis')
              onOpenChange(false)
            }}
          >
            <Layers className="mr-2 size-4 text-slate-500" />
            <span>Operational Analytics & KPIs</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Agent Actions */}
        <CommandGroup heading="Agent Autonomous Triggers">
          <CommandItem
            onSelect={() => {
              onTriggerSweep?.()
              onOpenChange(false)
            }}
          >
            <Play className="mr-2 size-4 text-slate-900" />
            <span>Run MonitorAgent Background Sweep</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onRecomputeRisk?.()
              onOpenChange(false)
            }}
          >
            <RefreshCw className="mr-2 size-4 text-slate-500" />
            <span>Recompute Geohash Density Clusters</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Incidents */}
        <CommandGroup heading={`Active Distress Incidents (${incidents.length})`}>
          {incidents.slice(0, 12).map((inc) => (
            <CommandItem
              key={inc.id}
              value={`${inc.id} ${inc.raw_text || ''} ${inc.status || ''}`}
              onSelect={() => {
                onSelectIncident?.(inc.id)
                onOpenChange(false)
              }}
            >
              <AlertTriangle className="mr-2 size-4 text-slate-500" />
              <div className="flex flex-1 items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{inc.id}</span>
                <span className="text-slate-500 truncate max-w-[200px]">{inc.raw_text}</span>
                <span className="ml-2 font-mono text-[10px] text-slate-500">Score {inc.priority?.score ?? 0}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Rescue Teams */}
        <CommandGroup heading={`Rescue Teams (${teams.length})`}>
          {teams.map((t) => (
            <CommandItem
              key={t.id}
              value={`${t.id} ${t.name || ''} ${t.status || ''}`}
              onSelect={() => {
                onSelectTeam?.(t.id)
                onOpenChange(false)
              }}
            >
              <Ship className="mr-2 size-4 text-slate-500" />
              <div className="flex flex-1 items-center justify-between">
                <span className="font-bold text-slate-900">{t.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{t.status} · Cap {t.capacity}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
