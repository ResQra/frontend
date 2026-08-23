import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Info,
  LifeBuoy,
  MapPinned,
  Siren,
} from 'lucide-react'
import { api } from '../api.js'
import { FALLBACK_SHELTERS } from '../fallback.js'
import MapView from '../components/MapView.jsx'
import { Badge, Card, SectionTitle } from '../components/ui.jsx'
import { useAuth } from '../AuthContext.jsx'

// Location heartbeat: resident app reports device GPS every 30 min so the
// agent always has a current location. Best-effort — silently skipped if
// permission denied.
function useLocationHeartbeat() {
  useEffect(() => {
    const send = () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {})
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000 }
      )
    }
    send()
    const id = setInterval(send, 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
}

const SEVERITY = {
  CRITICAL: { tone: 'red', icon: AlertTriangle, box: 'border-red-300 bg-red-50', title: 'text-red-900' },
  WARNING: { tone: 'amber', icon: AlertTriangle, box: 'border-amber-300 bg-amber-50', title: 'text-amber-900' },
  INFO: { tone: 'sky', icon: Info, box: 'border-sky-200 bg-sky-50', title: 'text-sky-900' },
}

export default function Home() {
  const { user } = useAuth()
  const [shelters, setShelters] = useState([])
  const [myIncident, setMyIncident] = useState(null)
  const [reports, setReports] = useState([])
  const [guides, setGuides] = useState([])

  useLocationHeartbeat()

  useEffect(() => {
    api
      .publicMapData()
      .then((data) => {
        setShelters(data.shelters || [])
        setMyIncident(data.my_incident)
      })
      .catch(() => setShelters(FALLBACK_SHELTERS))
    api
      .reports()
      .then((data) => setReports(data.reports || []))
      .catch(() => {})
    api
      .guides()
      .then((data) => setGuides((data.guides || []).filter((g) => g.language === 'en').slice(0, 2)))
      .catch(() => {})
  }, [])

  const firstName = (user?.name || '').split(' ')[0]

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[13px] font-medium text-slate-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
          {firstName ? `Hello, ${firstName}` : 'Welcome'}
        </h1>
      </section>

      {/* Primary SOS action */}
      <Link
        to="/request"
        className="group flex items-center justify-between rounded-2xl bg-red-600 px-5 py-4.5 shadow-sm transition hover:bg-red-700"
      >
        <div className="flex items-center gap-4 py-1">
          <span className="grid size-11 place-items-center rounded-xl bg-white/15">
            <Siren className="size-6 text-white" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[16px] font-bold text-white">Request Emergency Help</p>
            <p className="text-[13px] text-red-100">
              {myIncident ? 'You have an active request — update your situation' : 'Immediate assistance — your location is shared with rescuers'}
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 text-red-200 transition group-hover:translate-x-0.5" />
      </Link>

      {/* Active incident status banner */}
      {myIncident && (
        <Card className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Rescue request in progress</p>
              <p className="text-[13px] text-slate-500">
                Status: {myIncident.status.replaceAll('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <Link
            to="/track"
            className="flex items-center gap-1 text-[13px] font-semibold text-sky-700 hover:text-sky-900"
          >
            Track <ArrowRight className="size-4" />
          </Link>
        </Card>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/track"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
        >
          <MapPinned className="size-5 text-slate-700" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900">My Status</p>
          <p className="text-xs text-slate-500">Track your rescue request live</p>
        </Link>
        <Link
          to="/guides"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
        >
          <BookOpen className="size-5 text-slate-700" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900">Preparedness</p>
          <p className="text-xs text-slate-500">Survival guides and kit checklist</p>
        </Link>
      </section>

      {/* Official advisories */}
      {reports.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Official Advisories</SectionTitle>
          <div className="space-y-2.5">
            {reports.slice(0, 4).map((r) => {
              const sev = SEVERITY[r.severity] || SEVERITY.INFO
              const Icon = sev.icon
              return (
                <div key={r.id} className={`rounded-xl border px-4 py-3 ${sev.box}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Icon className={`mt-0.5 size-4 shrink-0 ${sev.title}`} />
                      <div>
                        <p className={`text-sm font-semibold ${sev.title}`}>{r.title}</p>
                        <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{r.body}</p>
                        {r.source && (
                          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {r.source}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge tone={sev.tone}>{r.severity}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Preparedness guides */}
      {guides.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            action={
              <Link to="/guides" className="text-[13px] font-semibold text-sky-700 hover:text-sky-900">
                View all
              </Link>
            }
          >
            Be Prepared
          </SectionTitle>
          <div className="space-y-2.5">
            {guides.map((g) => (
              <GuideRow key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* Safe zones map */}
      <section className="space-y-3">
        <SectionTitle
          action={
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <MapPinned className="size-3.5" /> {shelters.length} shelters
            </span>
          }
        >
          Safe Zones Near You
        </SectionTitle>
        <MapView shelters={shelters} myIncident={myIncident} />
        <div className="flex items-center gap-4 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Shelter
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" /> Your request
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Clock3 className="size-3.5" /> updated live
          </span>
        </div>
      </section>
    </div>
  )
}

function GuideRow({ guide }) {
  return (
    <Link
      to={`/guides/${guide.id}`}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{guide.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{guide.summary}</p>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <Badge tone="slate">{guide.read_minutes} min</Badge>
        <ChevronRight className="size-4 text-slate-400" />
      </div>
    </Link>
  )
}
