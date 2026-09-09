import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, MapPin, Users, CheckCircle2, Truck, Radio } from 'lucide-react'
import { api } from '../api.js'

const EVENT_ICONS = {
  incident_received: { icon: AlertTriangle, color: 'text-red-600' },
  priority_scored: { icon: Radio, color: 'text-amber-600' },
  status_changed: { icon: CheckCircle2, color: 'text-sky-400' },
  team_assigned: { icon: Truck, color: 'text-violet-400' },
  allocation_recommended: { icon: Users, color: 'text-cyan-600' },
  pending_action_approved: { icon: CheckCircle2, color: 'text-emerald-600' },
  pending_action_rejected: { icon: AlertTriangle, color: 'text-red-600' },
  sensor_event_received: { icon: Radio, color: 'text-pink-400' },
  location_identified: { icon: MapPin, color: 'text-green-400' },
  location_unverified: { icon: MapPin, color: 'text-amber-600' },
  risk_density_recomputed: { icon: AlertTriangle, color: 'text-orange-400' },
  team_location_updated: { icon: Truck, color: 'text-blue-600' },
}

function formatTime(ts) {
  if (ts === null || ts === undefined || ts === '') return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function EventRow({ event }) {
  const meta = EVENT_ICONS[event.type] || { icon: Clock, color: 'text-slate-400' }
  const Icon = meta.icon
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`grid size-7 place-items-center rounded-full bg-white border border-slate-200 ${meta.color}`}>
          <Icon className="size-3.5" />
        </div>
        <div className="mt-1 w-px flex-1 bg-slate-200" />
      </div>
      <div className="pb-4">
        <p className="text-[12px] leading-relaxed text-slate-700">{event.summary}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {formatTime(event.ts)} | {event.actor}
        </p>
      </div>
    </div>
  )
}

export default function IncidentTimeline({ incidentId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!incidentId) return
    let active = true
    setLoading(true)
    setError('')

    api
      .incidentTimeline(incidentId)
      .then((data) => {
        if (active) {
          setEvents(data.events || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) { setLoading(false); setError(err?.message || 'Failed to load timeline') }
      })

    return () => {
      active = false
    }
  }, [incidentId])

  if (!incidentId) return null
  if (loading) return <p className="p-4 text-xs text-slate-500">Loading timeline...</p>
  if (error) return <div className="p-4 text-xs text-red-600">Timeline failed: {error} <button className="ml-2 underline" onClick={() => window.location.reload()}>Retry</button></div>
  if (events.length === 0) return <p className="p-4 text-xs text-slate-500">No events yet for this incident.</p>

  return (
    <div className="max-h-[300px] overflow-y-auto px-4 py-3">
      <p className="mb-3 text-[11px] font-semibold uppercase text-slate-500">Incident Timeline</p>
      {events.map((event, i) => (
        <EventRow key={event.id ?? `${event.ts}-${i}`} event={event} />
      ))}
    </div>
  )
}
