import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, ClipboardList, CloudRain, HeartPulse, Home, Waves } from 'lucide-react'
import { api } from '../api.js'
import { Badge, EmptyState, PageHeader } from '../components/ui.jsx'

const CATEGORIES = [
  ['all', 'All', BookOpen],
  ['before', 'Before Flood', CloudRain],
  ['during', 'During Flood', Waves],
  ['after', 'After Flood', Home],
  ['health', 'Health', HeartPulse],
  ['kit', 'Emergency Kit', ClipboardList],
]

export default function Guides() {
  const [category, setCategory] = useState('all')
  const [language, setLanguage] = useState('all') // all | en | hi
  const [guides, setGuides] = useState(null)

  useEffect(() => {
    api
      .guides(category !== 'all' ? category : undefined)
      .then((data) => setGuides(data.guides || []))
      .catch(() => setGuides([]))
  }, [category])

  const visible = (guides || []).filter((g) => language === 'all' || g.language === language)

  return (
    <div className="space-y-5">
      <PageHeader title="Preparedness Guides" subtitle="Practical flood survival knowledge, in plain language" />

      {/* Language toggle */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[13px] font-semibold self-start">
        {[
          ['all', 'All'],
          ['en', 'English'],
          ['hi', 'हिन्दी'],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setLanguage(v)}
            className={`rounded-lg px-3.5 py-1.5 transition ${language === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
              category === key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {guides === null ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No guides in this filter"
          hint="Try a different category or language."
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((g) => (
            <Link
              key={g.id}
              to={`/guides/${g.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-semibold text-slate-900">{g.title}</p>
                  {g.language === 'hi' && <Badge tone="slate">हिन्दी</Badge>}
                  {g.type === 'checklist' && <Badge tone="sky">Checklist</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-500">{g.summary}</p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <Badge>{g.read_minutes} min</Badge>
                <ChevronRight className="size-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
