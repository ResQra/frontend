import { useEffect, useState } from 'react'
import {
  Layers,
  ChevronDown,
  Flame,
  Route,
  AlertTriangle,
  Ship,
  Home,
  Users,
  Activity,
  ShieldAlert,
  Satellite,
} from 'lucide-react'

const LAYERS = [
  { key: 'heatmap', label: 'Flood Heatmap', icon: Flame },
  { key: 'roads', label: 'Roads & Bridges', icon: Route },
  { key: 'incidents', label: 'SOS Incidents', icon: AlertTriangle },
  { key: 'teams', label: 'Team Location', icon: Ship },
  { key: 'shelters', label: 'Safe Shelters', icon: Home },
  { key: 'residents', label: 'Residents GPS', icon: Users },
  { key: 'areas', label: 'Risk Hotspots', icon: ShieldAlert },
  // Display-only NASA GIBS imagery — advisory, never a world-sync write.
  { key: 'satellite', label: 'NASA Satellite (advisory)', icon: Satellite, defaultOn: false },
]

export default function LayerToggle({ visible, onToggle, counts = {} }) {
  const [open, setOpen] = useState(false)
  const activeCount = LAYERS.filter((l) => visible[l.key] ?? l.defaultOn ?? true).length

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open ])

  return (
    <div className="absolute right-3 top-16 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/95 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 shadow-xl backdrop-blur transition hover:border-slate-400 hover:bg-slate-100"
      >
        <Layers className="size-3.5 text-slate-500" />
        <span className="tracking-wide">LAYERS</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200">
          {activeCount}/{LAYERS.length}
        </span>
        <ChevronDown className={`size-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div className="absolute right-0 top-full z-[1000] mt-1.5 w-56 rounded-lg border border-slate-200 bg-slate-100 p-1.5 shadow-2xl backdrop-blur animate-in fade-in">
            <div className="mb-1 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              Active Telemetry Layers
            </div>
            <div className="space-y-0.5">
              {LAYERS.map((layer) => {
                const Icon = layer.icon
                const isChecked = visible[layer.key] ?? layer.defaultOn ?? true
                return (
                  <label
                    key={layer.key}
                    className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition ${
                      isChecked
                        ? 'bg-slate-100/90 text-slate-800 font-medium'
                        : 'text-slate-500 hover:bg-slate-100/40 hover:text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(layer.key)}
                        className="size-3.5 rounded border-slate-300 bg-slate-50 text-slate-900 accent-slate-900 focus:ring-0"
                      />
                      <Icon className={`size-3.5 ${isChecked ? 'text-slate-600' : 'text-slate-600'}`} />
                      <span className="text-[11px]">{layer.label}</span>
                    </div>
                    {counts[layer.key] != null && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {counts[layer.key]}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
      )}
    </div>
  )
}
