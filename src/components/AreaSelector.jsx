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
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:border-slate-400 hover:text-slate-900 transition shadow-sm"
      >
        <MapPin className="size-3.5 text-slate-900" />
        <span className="max-w-[210px] truncate font-bold text-slate-900">{current.name.split(' (')[0]}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-black text-slate-900">
          DEFCON 1
        </span>
        <ChevronDown className={`size-3 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-2xl space-y-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
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
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <p className="truncate font-semibold">{preset.name.split(' (')[0]}</p>
                    <p className={`text-[10px] truncate ${active ? 'text-zinc-800' : 'text-slate-500'}`}>
                      {preset.name.includes('(') ? preset.name.split('(')[1].replace(')', '') : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      active
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-200 text-slate-900'
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
