import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Cpu,
  Layers,
  MapPin,
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
            <Radio className="mr-2 size-4 text-zinc-400" />
            <span>Tactical Map Cockpit</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('agents')
              onOpenChange(false)
            }}
          >
            <Cpu className="mr-2 size-4 text-zinc-400" />
            <span>Agent Fleet Observability</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('teams')
              onOpenChange(false)
            }}
          >
            <Ship className="mr-2 size-4 text-zinc-400" />
            <span>Rescue Fleet Directory</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateTab?.('simulation')
              onOpenChange(false)
            }}
          >
            <Layers className="mr-2 size-4 text-zinc-400" />
            <span>Simulation Studio & Sensor Spikes</span>
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
            <Play className="mr-2 size-4 text-white" />
            <span>Run MonitorAgent Background Sweep</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onRecomputeRisk?.()
              onOpenChange(false)
            }}
          >
            <RefreshCw className="mr-2 size-4 text-zinc-400" />
            <span>Recompute Geohash Density Clusters</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Incidents */}
        <CommandGroup heading="Active Distress Incidents">
          {incidents.slice(0, 8).map((inc) => (
            <CommandItem
              key={inc.id}
              onSelect={() => {
                onSelectIncident?.(inc.id)
                onOpenChange(false)
              }}
            >
              <AlertTriangle className="mr-2 size-4 text-zinc-400" />
              <div className="flex flex-1 items-center justify-between">
                <span className="font-mono font-bold text-white">{inc.id}</span>
                <span className="text-zinc-400 truncate max-w-[200px]">{inc.raw_text}</span>
                <span className="ml-2 font-mono text-[10px] text-zinc-500">Score {inc.priority?.score ?? 0}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Rescue Teams */}
        <CommandGroup heading="Rescue Teams">
          {teams.map((t) => (
            <CommandItem
              key={t.id}
              onSelect={() => {
                onSelectTeam?.(t.id)
                onOpenChange(false)
              }}
            >
              <Ship className="mr-2 size-4 text-zinc-400" />
              <div className="flex flex-1 items-center justify-between">
                <span className="font-bold text-white">{t.name}</span>
                <span className="font-mono text-[10px] text-zinc-400">{t.status} · Cap {t.capacity}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
