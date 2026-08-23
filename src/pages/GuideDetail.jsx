import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ClipboardList, Clock3 } from 'lucide-react'
import { api } from '../api.js'
import { BackButton } from '../App.jsx'
import { Badge } from '../components/ui.jsx'

const CATEGORY_LABELS = {
  before: 'Before Flood',
  during: 'During Flood',
  after: 'After Flood',
  health: 'Health',
  kit: 'Emergency Kit',
}

export default function GuideDetail() {
  const { id } = useParams()
  const [guide, setGuide] = useState(undefined) // undefined=loading, null=missing

  useEffect(() => {
    api
      .guideDetail(id)
      .then(setGuide)
      .catch(() => setGuide(null))
  }, [id])

  if (guide === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-200" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    )
  }

  if (guide === null) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm font-semibold text-slate-900">Guide not found</p>
        <p className="mt-1 text-[13px] text-slate-500">It may have been removed.</p>
      </div>
    )
  }

  return (
    <article className="space-y-5 pb-4">
      <BackButton />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="sky">{CATEGORY_LABELS[guide.category] || guide.category}</Badge>
          {guide.type === 'checklist' && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
              <ClipboardList className="size-3" /> Checklist
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] font-medium text-slate-400">
            <Clock3 className="size-3.5" /> {guide.read_minutes} min read
          </span>
        </div>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900">
          {guide.title}
        </h1>
        <p className="border-l-[3px] border-slate-900 pl-3.5 text-[14px] leading-relaxed text-slate-600">
          {guide.summary}
        </p>
      </header>

      {guide.type === 'checklist' ? (
        <Checklist guide={guide} />
      ) : (
        <div className="space-y-4">
          {(guide.body || '').split('\n\n').map((para, i) => (
            <p key={i} className="text-[15px] leading-[1.75] text-slate-700">
              {para}
            </p>
          ))}
        </div>
      )}
    </article>
  )
}

function Checklist({ guide }) {
  const storageKey = `resqra_kit_${guide.id}`
  const [checked, setChecked] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))
    } catch {
      return new Set()
    }
  })

  const items = guide.items || []
  const done = checked.size
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  function toggle(i) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between text-[13px] font-semibold">
          <span className="text-slate-700">
            {done} of {items.length} packed
          </span>
          <span className={pct === 100 ? 'text-emerald-600' : 'text-slate-400'}>{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="mt-2 text-[12px] font-medium text-emerald-600">
            Your kit is complete. Check it again every flood season.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.map((item, i) => {
          const on = checked.has(i)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                i > 0 ? 'border-t border-slate-100' : ''
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition ${
                  on ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                }`}
              >
                {on && <Check className="size-3.5 text-white" strokeWidth={3.5} />}
              </span>
              <span className={`text-[14px] leading-snug ${on ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {item}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[12px] text-slate-400">
        Progress is saved on this device. Pack the bag once — keep it by the door during flood season.
      </p>
    </div>
  )
}
