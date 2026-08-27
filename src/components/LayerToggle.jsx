import { useState } from 'react'
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
} from 'lucide-react'

const LAYERS = [
  { key: 'heatmap', label: 'Flood Heatmap', icon: Flame },
  { key: 'roads', label: 'Roads & Bridges', icon: Route },
  { key: 'incidents', label: 'SOS Incidents', icon: AlertTriangle },
  { key: 'teams', label: 'Rescue Boats', icon: Ship },
  { key: 'shelters', label: 'Safe Shelters', icon: Home },
  { key: 'residents', label: 'Residents GPS', icon: Users },
  { key: 'areas', label: 'Risk Hotspots', icon: ShieldAlert },
]

export default function LayerToggle({ visible, onToggle, counts = {} }) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(visible).filter(Boolean).length

  return (
    <div className="absolute right-3 top-3 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/90 px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 shadow-xl backdrop-blur transition hover:border-zinc-600 hover:bg-zinc-900"
      >
        <Layers className="size-3.5 text-zinc-400" />
        <span className="tracking-wide">LAYERS</span>
        <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-800">
          {activeCount}/{LAYERS.length}
        </span>
        <ChevronDown className={`size-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[1000] mt-1.5 w-56 rounded-lg border border-zinc-800 bg-black/95 p-1.5 shadow-2xl backdrop-blur animate-in fade-in">
            <div className="mb-1 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80">
              Active Telemetry Layers
            </div>
            <div className="space-y-0.5">
              {LAYERS.map((layer) => {
                const Icon = layer.icon
                const isChecked = visible[layer.key] ?? true
                return (
                  <label
                    key={layer.key}
                    className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition ${
                      isChecked
                        ? 'bg-zinc-900/90 text-zinc-100 font-medium'
                        : 'text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(layer.key)}
                        className="size-3.5 rounded border-zinc-700 bg-zinc-950 text-white accent-white focus:ring-0"
                      />
                      <Icon className={`size-3.5 ${isChecked ? 'text-zinc-300' : 'text-zinc-600'}`} />
                      <span className="text-[11px]">{layer.label}</span>
                    </div>
                    {counts[layer.key] != null && (
                      <span className="font-mono text-[10px] text-zinc-500">
                        {counts[layer.key]}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
