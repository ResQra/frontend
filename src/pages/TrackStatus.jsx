import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileWarning, RefreshCw, Siren } from 'lucide-react'
import { api } from '../api.js'
import { Badge, Card, PageHeader } from '../components/ui.jsx'

const STATUS_STEPS = ['NEW', 'VERIFIED', 'PRIORITIZED', 'ASSIGNED', 'IN_PROGRESS', 'RESCUED', 'RESOLVED']

const STEP_LABELS = {
  NEW: 'Received',
  VERIFIED: 'Verified',
  PRIORITIZED: 'In rescue queue',
  ASSIGNED: 'Team assigned',
  IN_PROGRESS: 'Rescue underway',
  RESCUED: 'Rescued',
  RESOLVED: 'Closed',
}

export default function TrackStatus() {
  const [incidents, setIncidents] = useState(null)
  const [error, setError] = useState('')

  async function refresh() {
    try {
      const data = await api.myIncidents()
      setIncidents(data.incidents || [])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5000) // poll every 5s (BRAINSTORM §4.5)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Requests"
        subtitle="Live status of your help requests"
        back={
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
            <RefreshCw className="size-3.5" /> auto-refreshing
          </span>
        }
      />

      {error && (
        <Card className="flex items-start gap-3 px-4 py-3.5">
          <FileWarning className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="text-[13px] leading-snug text-slate-600">
            <b className="text-slate-900">Status temporarily unavailable.</b> {error}
          </div>
        </Card>
      )}

      {incidents && incidents.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">No active requests</p>
          <p className="mt-1 text-[13px] text-slate-500">Glad you are safe. Help is one tap away if that changes.</p>
          <Link
            to="/request"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <Siren className="size-4" /> Request help
          </Link>
        </div>
      )}

      {incidents?.map((inc) => {
        const stepIdx = STATUS_STEPS.indexOf(inc.status)
        return (
          <Card key={inc.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] font-medium text-slate-400">{inc.id}</span>
              <Badge tone={inc.status === 'RESCUED' || inc.status === 'RESOLVED' ? 'emerald' : 'sky'}>
                {STEP_LABELS[inc.status] || inc.status}
              </Badge>
            </div>
            <p className="mt-2.5 text-sm leading-snug text-slate-800">"{inc.raw_text}"</p>

            {/* Vertical stepper */}
            <div className="mt-4 space-y-0">
              {STATUS_STEPS.slice(0, 6).map((s, i) => {
                const done = i < stepIdx
                const current = i === stepIdx
                if (i > stepIdx && stepIdx >= 5) return null
                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${
                          done
                            ? 'border-sky-600 bg-sky-600'
                            : current
                              ? 'border-red-600 bg-white'
                              : 'border-slate-200 bg-white'
                        }`}
                      >
                        {done && <Check className="size-3 text-white" strokeWidth={3.5} />}
                        {current && <span className="size-2 rounded-full bg-red-600" />}
                      </span>
                      {i < 5 && i < Math.max(stepIdx, 4) && (
                        <span className={`h-5 w-0.5 ${i < stepIdx ? 'bg-sky-600' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <p
                      className={`-mt-0.5 text-[13px] ${
                        current ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {STEP_LABELS[s]}
                      {current && inc.status === 'ASSIGNED' && inc.assigned_team && (
                        <span className="ml-1.5 font-mono text-[11px] font-medium text-sky-700">
                          ({inc.assigned_team.replace('team_', '').toUpperCase()})
                        </span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>

            {(inc.people != null || inc.vulnerabilities?.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                {inc.people != null && <Badge>{inc.people} people</Badge>}
                {inc.vulnerabilities?.map((v) => (
                  <Badge key={v} tone="amber">{v}</Badge>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
