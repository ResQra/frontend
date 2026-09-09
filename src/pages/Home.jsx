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
import { toast } from 'sonner'
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
  const [routeLine, setRouteLine] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [sheltersFallback, setSheltersFallback] = useState(false)

  useLocationHeartbeat()

  useEffect(() => {
    api
      .publicMapData()
      .then((data) => {
        setShelters(data.shelters || [])
        setMyIncident(data.my_incident)
      })
      .catch(() => { setShelters(FALLBACK_SHELTERS); setSheltersFallback(true) })
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

  function nearestOpenShelter(origin) {
    const open = shelters.filter((s) => s.location && (s.capacity || 0) - (s.current_occupancy || 0) > 0)
    const pool = open.length > 0 ? open : shelters.filter((s) => s.location)
    let best = null
    let bestD = Infinity
    for (const s of pool) {
      const d = Math.hypot(s.location.lat - origin.lat, s.location.lng - origin.lng)
      if (d < bestD) {
        bestD = d
        best = s
      }
    }
    return best
  }

  async function findSafestRoute() {
    const origin = myIncident?.location
    if (!origin) return
    const shelter = nearestOpenShelter(origin)
    if (!shelter) return
    setRouteLoading(true)
    try {
      const res = await api.safestRoute({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: shelter.location.lat, lng: shelter.location.lng },
        shelter_id: shelter.id,
      })
      const coords = res.best?.coords
      const ok = Array.isArray(coords) && coords.length >= 2 &&
        coords.every((p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
      setRouteInfo({ shelter, best: res.best, explanation: res.route_explanation, disclaimer: res.disclaimer })
      // Server geometry first (closure-aware); straight line only as fallback.
      setRouteLine(ok ? coords : [
        [origin.lat, origin.lng],
        [shelter.location.lat, shelter.location.lng],
      ])
    } catch {
      toast.error('Route failed', { description: 'Could not compute a route — try again.' })
      setRouteLine([
        [origin.lat, origin.lng],
        [shelter.location.lat, shelter.location.lng],
      ])
      setRouteInfo({ shelter, best: { distance_km: null, feasible: true } })
    } finally {
      setRouteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rise relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-5 text-white shadow-lg">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />
        <p className="tnum relative text-[12px] font-medium text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="relative mt-0.5 text-[22px] font-extrabold tracking-tight">
          {firstName ? `Hello, ${firstName}` : 'Welcome'}
        </h1>
        <p className="relative mt-1 flex items-center gap-1.5 text-[12px] text-slate-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Rautahat flood response is active — help is one tap away
        </p>
      </section>

      {/* Primary SOS action */}
      <Link
        to={myIncident ? '/track' : '/request'}
        className="rise group relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-600 to-rose-600 px-5 py-4 shadow-[0_16px_40px_-12px_rgba(220,38,38,0.55)] transition hover:brightness-110"
        style={{ animationDelay: '60ms' }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl transition group-hover:bg-white/25" />
        <div className="flex items-center gap-4 py-1">
          <span className="grid size-11 place-items-center rounded-xl bg-white/15">
            <Siren className="size-6 text-white" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[16px] font-bold text-white">Request Emergency Help</p>
            <p className="text-[13px] text-red-100">
              {myIncident ? 'You have an active request — view it or add an update' : 'Immediate assistance — your location is shared with rescuers'}
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 text-red-200 transition group-hover:translate-x-0.5" />
      </Link>

      {/* Active incident status banner */}
      {myIncident && (
        <Card className="rise flex items-center justify-between border-sky-200 bg-gradient-to-r from-sky-50 to-white px-4 py-3.5" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-600 text-white shadow-sm">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Rescue request in progress</p>
              <p className="tnum text-[13px] capitalize text-slate-500">
                Status: {(myIncident.status || 'NEW').replaceAll('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <Link
            to="/track"
            className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-slate-700"
          >
            Track <ArrowRight className="size-4" />
          </Link>
        </Card>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/track"
          className="lift rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-200"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700">
            <MapPinned className="size-5" />
          </span>
          <p className="mt-2.5 text-sm font-bold text-slate-900">My Status</p>
          <p className="text-xs text-slate-500">Track your rescue request live</p>
        </Link>
        <Link
          to="/guides"
          className="lift rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen className="size-5" />
          </span>
          <p className="mt-2.5 text-sm font-bold text-slate-900">Preparedness</p>
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
        {sheltersFallback && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-medium text-amber-800">
            Demo locations — backend offline, live capacity unavailable.
          </p>
        )}
        <button
          onClick={findSafestRoute}
          disabled={routeLoading || !myIncident?.location}
          title={myIncident?.location ? undefined : 'Enable GPS on your request to compute a road route — a landmark alone can’t route.'}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {routeLoading ? 'Finding safest route…' : '🧭 Safest route to nearest shelter'}
        </button>
        {!myIncident?.location && (
          <p className="text-[12px] text-slate-500">
            Enable GPS on your request to compute a road route — a landmark alone can't route.
          </p>
        )}
        {routeInfo && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-900">
            → {routeInfo.shelter.name}
            {routeInfo.best?.distance_km != null && ` · ${routeInfo.best.distance_km} km`}
            {routeInfo.best?.feasible === false && ' · check closures'}
            {routeInfo.explanation?.explanation && (
              <span className="block text-[12px] text-emerald-800">{routeInfo.explanation.explanation}</span>
            )}
            <span className="block text-[11px] text-emerald-700">{routeInfo.disclaimer || 'Decision support only — follow official guidance.'}</span>
          </p>
        )}
        <MapView
          shelters={shelters}
          myIncident={myIncident}
          routeLine={routeLine}
          visibleLayers={{ heatmap: false, roads: false, incidents: false, teams: false, shelters: true, residents: false, areas: true }}
        />
        <div className="flex items-center gap-4 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Shelter
          </span>
          {myIncident?.location && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" /> Your request
            </span>
          )}
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
