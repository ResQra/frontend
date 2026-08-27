import { useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'

const PRESETS = [
  { id: 'rautahat', name: 'Rautahat District (All Sectors)', status: 'DEFCON 1' },
  { id: 'gaur_urban', name: 'Gaur Municipality (Bagmati Breach)', status: 'DEFCON 1' },
  { id: 'lalbakaiya_tikuliya', name: 'Tikuliya Ghat (Lalbakaiya Basin)', status: 'DEFCON 1' },
  { id: 'garuda', name: 'Garuda Municipality (Central Plain)', status: 'DEFCON 1' },
  { id: 'chandrapur', name: 'Chandrapur (Highway Evac Base)', status: 'DEFCON 1' },
]

export default function AreaSelector({ value = 'rautahat', onChange }) {
  const [open, setOpen] = useState(false)
  const current = PRESETS.find((p) => p.id === value) || PRESETS[0]

  return (
    <div className="relative font-mono text-xs select-none">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-200 hover:border-zinc-700 hover:text-white transition shadow-sm"
      >
        <MapPin className="size-3.5 text-white" />
        <span className="max-w-[210px] truncate font-bold text-white">{current.name.split(' (')[0]}</span>
        <span className="rounded bg-white px-1.5 py-0.2 text-[9px] font-black text-black">
          DEFCON 1
        </span>
        <ChevronDown className={`size-3 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-zinc-800 bg-[#09090b] p-1 shadow-2xl space-y-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80">
              Rautahat District Flood Sectors (HDX)
            </div>
            {PRESETS.map((preset) => {
              const active = preset.id === value
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onChange(preset.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <p className="truncate font-semibold">{preset.name.split(' (')[0]}</p>
                    <p className={`text-[10px] truncate ${active ? 'text-zinc-800' : 'text-zinc-500'}`}>
                      {preset.name.includes('(') ? preset.name.split('(')[1].replace(')', '') : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      active
                        ? 'bg-black text-white'
                        : 'bg-zinc-800 text-white'
                    }`}
                  >
                    LIVE
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
