import { useEffect, useRef, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Flag,
  Gauge,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Scale,
  Timer,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, ensureDemoAuth } from '../api.js'
import { Link } from 'react-router-dom'

const SCENARIO = 'flood-48h-01'
const COORDINATOR_URL = (import.meta.env.VITE_COORDINATOR_URL || 'http://localhost:5173').replace(/\/$/, '')

function MapFix() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => { try { map.invalidateSize() } catch { /* noop */ } }, 250)
    return () => clearTimeout(t)
  }, [map])
  return null
}

// Backend rows occasionally carry null/invalid coords — filter before
// Leaflet ever sees them (NaN lat/lng unmounts the whole map).
function okLatLng(loc) {
  return !!loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))
}

function teamStyle(status) {
  if (status === 'ON_MISSION') return { color: '#7e22ce', fillColor: '#a855f7' }
  if (status === 'RETURNING') return { color: '#0284c7', fillColor: '#38bdf8' }
  if (status === 'OFFLINE' || status === 'UNAVAILABLE') return { color: '#52525b', fillColor: '#27272a' }
  return { color: '#1d4ed8', fillColor: '#3b82f6' }
}

function incidentStyle(score) {
  if (score >= 8) return { color: '#b91c1c', fillColor: '#ef4444' }
  if (score >= 4) return { color: '#d97706', fillColor: '#f59e0b' }
  return { color: '#ca8a04', fillColor: '#eab308' }
}

function verdictStyle(s, provisional) {
  const dash = provisional ? ' border-dashed opacity-80' : ''
  if (s === 'PASS') return `border-teal-500/40 bg-teal-950/30 text-teal-200${dash}`
  if (s === 'PARTIAL') return `border-amber-500/40 bg-amber-950/20 text-amber-200${dash}`
  return `border-red-500/40 bg-red-950/20 text-red-300${dash}`
}

function fmt(v) {
  if (v === null || v === undefined) return '—'
  return Number.isInteger(Number(v)) ? String(v) : Number(v).toFixed(1)
}

function incidentIdOf(e) {
  return (e.payload || {}).incident_id || null
}

export default function RunConsole() {
  const [run, setRun] = useState(null)
  const [score, setScore] = useState(null)
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [incidents, setIncidents] = useState([])
  const [shelters, setShelters] = useState([])
  const [cards, setCards] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [speed, setSpeed] = useState(3.2)
  const [openEvent, setOpenEvent] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const runIdRef = useRef(null)
  runIdRef.current = run?.run_id || null
  // Poll sequencing: only the latest refresh may write state, and never
  // after unmount or after the run was replaced/reset.
  const seqRef = useRef(0)
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  async function refresh(id, quiet = false) {
    const my = ++seqRef.current
    try {
      const [r, s, tl, ws, q, pc] = await Promise.all([
        api.runGet(id),
        api.runScore(id).catch(() => null),
        api.runTimeline(id, 100).catch(() => ({ events: [] })),
        api.simState().catch(() => ({ teams: [], shelters: [] })),
        api.queue().catch(() => ({ incidents: [] })),
        api.pendingActions().catch(() => ({ pending_actions: [] })),
      ])
      if (!mountedRef.current || my !== seqRef.current || runIdRef.current !== id) return null
      setRun(r)
      setScore(s)
      setEvents(tl?.events || [])
      setTeams(ws?.teams || [])
      setShelters(ws?.shelters || [])
      setIncidents(q?.incidents || [])
      setCards(pc?.pending_actions || pc?.cards || [])
      setError('')
      return r
    } catch (err) {
      if (!quiet && mountedRef.current && my === seqRef.current) {
        setError(err.message || 'Refresh failed')
      }
      return null
    }
  }

  useEffect(() => { ensureDemoAuth() }, [])

  useEffect(() => {
    if (run?.status !== 'RUNNING') return undefined
    const id = setInterval(() => {
      if (runIdRef.current) refresh(runIdRef.current, true)
    }, 3000)
    return () => clearInterval(id)
  }, [run?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function act(label, fn) {
    setBusy(label)
    setError('')
    try {
      const out = await fn()
      toast.success(label)
      return out
    } catch (err) {
      setError(err.message || `${label} failed`)
      toast.error(err.message || `${label} failed`)
      return null
    } finally {
      setBusy('')
    }
  }

  async function handleStart() {
    const r = await act('48h run started — ticker on', () => api.runStart(SCENARIO))
    if (r?.run_id) {
      setSpeed(r.speed || 3.2)
      setSelectedId(null)
      await refresh(r.run_id)
    }
  }

  async function handleTick(minutes) {
    if (!run) return
    const r = await act(`Advanced ${minutes} sim-min`, () => api.runTick(run.run_id, minutes))
    if (r) await refresh(run.run_id, true)
  }

  async function handlePause() {
    if (!run) return
    await act('Run paused', () => api.runPause(run.run_id))
    await refresh(run.run_id, true)
  }

  async function handleResume() {
    if (!run) return
    await act('Run resumed', () => api.runResume(run.run_id))
    await refresh(run.run_id, true)
  }

  async function handleSpeed(v) {
    const prev = speed
    setSpeed(v)
    if (!run) return
    try {
      setBusy(`Speed ${v} sim-min/s`)
      setError('')
      await api.runSpeed(run.run_id, v)
      toast.success(`Speed ${v} sim-min/s`)
      await refresh(run.run_id, true)
    } catch (err) {
      setSpeed(prev)
      setError(err.message || 'Speed change failed')
      toast.error(err.message || 'Speed change failed')
    } finally {
      setBusy('')
    }
  }

  async function handleStop() {
    if (!run) return
    await act('Run stopped', () => api.runStop(run.run_id))
    await refresh(run.run_id, true)
  }

  async function handleReset() {
    await act('World reset to baseline', () => api.demoReset())
    setRun(null)
    setScore(null)
    setEvents([])
    setTeams([])
    setIncidents([])
    setShelters([])
    setCards([])
    setSelectedId(null)
  }

  async function handleCollect() {
    if (!run) return
    const out = await act('Debate verdicts collected', () => api.runCollectDebates(run.run_id, 10))
    if (out) await refresh(run.run_id, true)
  }

  const running = run?.status === 'RUNNING'
  const paused = run?.status === 'PAUSED'
  const provisional = score ? !score.final : true
  const selected = selectedId ? incidents.find((i) => i.id === selectedId) || null : null
  const selectedEvents = selectedId ? events.filter((e) => incidentIdOf(e) === selectedId) : []
  const selectedCard = selectedId ? cards.find((c) => c.incident_id === selectedId) || null : null
  const selectedDebate = selectedCard?.payload?.debate
    || [...events].reverse().find((e) => e.type === 'debate_concluded' && incidentIdOf(e) === selectedId)
      ?.payload
  const selectedApproval = selectedId
    ? [...events].reverse().find((e) => (e.type === 'pending_action_approved' || e.type === 'pending_action_rejected') && incidentIdOf(e) === selectedId)
    : null

  function responseMin(inc) {
    if (inc?.assigned_sim_min == null || inc?.sim_min == null) return null
    return Math.max(0, Number(inc.assigned_sim_min) - Number(inc.sim_min))
  }

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 gap-5">
      {/* Header + clock + controls */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="size-4 text-teal-400" />
              Autonomous 48h run — one click, full flood story
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">
              100 deterministic SOS across Rautahat. Every single one runs the full pipeline —
              intake, scoring, <strong className="text-zinc-200">debate</strong>, recommendation,
              approval, dispatch, re-plan. Click any SOS marker or timeline row to audit it:
              what the agent proposed, what was decided, what actually happened.
            </p>
          </div>
          <div className="flex items-start gap-3">
            {run && (
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-teal-300">{run.clock_label}</p>
                <p className={`font-mono text-[11px] ${running ? 'text-teal-400' : paused ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {run.status}{running ? ' · live' : ''}
                </p>
              </div>
            )}
            <a
              href={COORDINATOR_URL}
              target="_blank"
              rel="noreferrer"
              title="Open the coordinator command view (product client)"
              className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-950/30 px-3 py-1.5 text-xs font-semibold text-teal-200 hover:bg-teal-950/60 transition"
            >
              Coordinator view <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs text-red-300 font-mono flex items-center gap-2">
            <XCircle className="size-3.5 shrink-0" /> {error}
            <span className="text-zinc-500">· is the backend running?</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!run ? (
            <button
              onClick={handleStart}
              disabled={busy !== ''}
              className="flex items-center gap-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs px-4 py-2 transition"
            >
              {busy !== '' ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
              START 48H RUN
            </button>
          ) : (
            <>
              {(running || paused) && (
                <button
                  onClick={() => handleTick(60)}
                  disabled={busy !== '' || !running}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs px-3 py-1.5 transition disabled:opacity-40"
                >
                  <Timer className="size-3.5" /> +60 sim-min
                </button>
              )}
              {running ? (
                <button onClick={handlePause} disabled={busy !== ''} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition">
                  <Pause className="size-3.5" /> Pause
                </button>
              ) : paused ? (
                <button onClick={handleResume} disabled={busy !== ''} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition">
                  <Play className="size-3.5" /> Resume
                </button>
              ) : null}
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Gauge className="size-3.5" /> Speed
                <select
                  value={speed}
                  onChange={(e) => handleSpeed(Number(e.target.value))}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value={1}>1× slow</option>
                  <option value={3.2}>3.2× demo</option>
                  <option value={12}>12× fast</option>
                </select>
              </label>
              <button onClick={handleCollect} disabled={busy !== '' || !run} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition">
                <RefreshCw className={`size-3.5 ${busy !== '' ? 'animate-spin' : ''}`} /> Collect debates
              </button>
              {(running || paused) && (
                <button onClick={handleStop} disabled={busy !== ''} className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40 transition">
                  <Flag className="size-3.5" /> Stop
                </button>
              )}
              <button onClick={handleReset} disabled={busy !== ''} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition">
                <RotateCcw className="size-3.5" /> Reset world
              </button>
            </>
          )}
        </div>
      </div>

      {!run ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
          <Activity className="size-8 text-zinc-700 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No run yet</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            Press START 48H RUN. The ticker advances the sim clock by itself — pause it,
            step it, or speed it up any time. Score, timeline and map update live.
            Not everyone gets rescued: 6 teams, 100 SOS, 48 hours — scarcity is the test.
          </p>
        </div>
      ) : (
        <>
          {/* Scorecard */}
          {score ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { label: 'Lives saved', value: fmt(score.lives_saved), tone: 'text-teal-300' },
                  { label: 'At risk', value: fmt(score.lives_at_risk), tone: 'text-red-300' },
                  { label: 'Rescued', value: `${fmt(score.rescued_count)}/${fmt(score.incidents_total)}`, tone: 'text-zinc-100' },
                  { label: 'Coverage', value: `${Math.round((score.dispatch_coverage || 0) * 100)}%`, tone: 'text-zinc-100' },
                  { label: 'P90 response', value: score.response_p90_sim_min == null ? '—' : `${fmt(score.response_p90_sim_min)}m`, tone: 'text-zinc-100' },
                  { label: 'Debates', value: fmt(score.debates_held), tone: 'text-zinc-100' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className={`font-mono text-xl font-bold ${kpi.tone}`}>{kpi.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {provisional && (
                  <span className="rounded-full border border-dashed border-zinc-600 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400">
                    LIVE — verdicts finalize at freeze
                  </span>
                )}
                {(score.verdicts || []).map((v) => (
                  <span key={v.criterion} title={v.detail} className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${verdictStyle(v.status, provisional)}`}>
                    {v.criterion}: {v.status}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500 font-mono">
              Score loading — refreshes automatically while the run is live…
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Map */}
            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <div className="py-2.5 px-3.5 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-teal-400" />
                  <span className="text-xs font-bold text-zinc-200">Live run map — click any SOS to audit it</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {teams.length} teams · {incidents.length} open SOS · {shelters.length} shelters
                </span>
              </div>
              <div className="h-72 sm:h-96 w-full">
                <MapContainer center={[26.79, 85.29]} zoom={11} scrollWheelZoom={false} className="h-full w-full">
                  <MapFix />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="dark-tiles"
                  />
                  {teams.filter((t) => okLatLng(t.location)).map((t) => t.location && (
                    <CircleMarker
                      key={t.id}
                      center={[Number(t.location.lat), Number(t.location.lng)]}
                      radius={6}
                      pathOptions={{ ...teamStyle(t.status), weight: 2, fillOpacity: 0.9 }}
                    >
                      <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                        <span className="font-mono text-[10px]">{t.name} · {t.status}</span>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                  {incidents.filter((inc) => okLatLng(inc.location)).map((inc) => inc.location && (
                    <CircleMarker
                      key={inc.id}
                      center={[Number(inc.location.lat), Number(inc.location.lng)]}
                      radius={4 + Math.min(6, Number(inc.people || 1))}
                      pathOptions={{
                        ...incidentStyle(Number((inc.priority || {}).score || 0)),
                        weight: selectedId === inc.id ? 4 : 2,
                        fillOpacity: 0.9,
                      }}
                      eventHandlers={{ click: () => setSelectedId(inc.id) }}
                    >
                      <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                        <span className="font-mono text-[10px]">
                          {inc.id} · {inc.people || 1}p · {inc.status} — click to audit
                        </span>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                  {shelters.filter((s) => okLatLng(s.location)).map((s) => s.location && (
                    <CircleMarker
                      key={s.id}
                      center={[Number(s.location.lat), Number(s.location.lng)]}
                      radius={5}
                      pathOptions={{ color: '#15803d', fillColor: '#22c55e', weight: 2, fillOpacity: 0.9 }}
                    >
                      <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                        <span className="font-mono text-[10px]">
                          {s.name} · {s.current_occupancy ?? 0}/{s.capacity ?? '?'}
                        </span>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="size-3.5" /> Run timeline
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">{events.length} events</span>
              </div>
              {events.length === 0 && (
                <p className="text-xs text-zinc-500">Nothing yet — events land here as the clock advances.</p>
              )}
              <div className="space-y-1.5 max-h-[28rem] overflow-y-auto pr-1">
                {events.map((e) => {
                  const isDebate = e.type === 'debate_concluded'
                  const iid = incidentIdOf(e)
                  const open = openEvent === e.id
                  return (
                    <div key={e.id} className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
                      <button
                        onClick={() => {
                          if (isDebate) setOpenEvent(open ? null : e.id)
                          else if (iid) setSelectedId(iid)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-mono text-[10px] font-bold ${isDebate ? 'text-amber-300' : 'text-teal-300'}`}>
                            {e.type}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {e.ts ? new Date(Number(e.ts)).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">{e.summary}</p>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500 mt-0.5">
                          {isDebate ? (
                            <>
                              <ChevronDown className={`size-3 transition ${open ? 'rotate-180' : ''}`} />
                              {open ? 'hide transcript' : 'read debate transcript'}
                            </>
                          ) : iid ? (
                            <>audit {iid} →</>
                          ) : null}
                        </span>
                      </button>
                      {isDebate && open && (
                        <div className="border-t border-zinc-800 px-3 py-2 space-y-1.5">
                          <p className="font-mono text-[11px] text-amber-200">
                            Winner: {(e.payload || {}).winner || '—'}
                          </p>
                          <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {(e.payload || {}).verdict || 'No transcript recorded.'}
                          </p>
                          {iid && (
                            <button onClick={() => setSelectedId(iid)} className="font-mono text-[10px] text-teal-300 hover:text-teal-200">
                              open full SOS audit →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                <AlertOctagon className="size-3" /> Every row is a real backend ledger entry.
              </p>
            </div>
          </div>
        </>
      )}

      {/* SOS audit drawer */}
      {(selected || selectedId) && (
        <div className="fixed inset-0 z-[2000] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto bg-zinc-950 border-l border-zinc-800 p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] text-zinc-500">SOS AUDIT</p>
                <h3 className="font-mono text-sm font-bold text-zinc-100">{selectedId}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800">
                <X className="size-4" />
              </button>
            </div>

            {!selected ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-400 leading-relaxed">
                This SOS is resolved and off the open queue — its story lives in the
                timeline below ({selectedEvents.length} recorded events).
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                    (selected.priority || {}).score >= 8 ? 'bg-red-500/90 text-white'
                    : (selected.priority || {}).score >= 4 ? 'bg-amber-500/90 text-zinc-950'
                    : 'bg-yellow-400/90 text-zinc-950'}`}>
                    Score {(selected.priority || {}).score ?? '?'} ({(selected.priority || {}).band || 'UNRATED'})
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">{selected.status}</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">“{selected.raw_text}”</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-zinc-400">
                  <span>People: <b className="text-zinc-200">{selected.people ?? 1}</b></span>
                  <span>Water: <b className={selected.water_rising ? 'text-red-300' : 'text-zinc-200'}>{selected.water_rising ? 'RISING' : 'steady'}</b></span>
                  <span className="col-span-2">Vulnerable: <b className="text-amber-300">{(selected.vulnerabilities || []).join(', ') || '—'}</b></span>
                  <span className="col-span-2">Where: <b className="text-zinc-200">{selected.location_text || selected.location?.label}</b></span>
                  <span className="col-span-2">Response: <b className="text-teal-300">{responseMin(selected) == null ? 'pending' : `${fmt(responseMin(selected))} sim-min`}</b></span>
                </div>
                {((selected.priority || {}).reasons || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(selected.priority.reasons || []).map((r, i) => (
                      <span key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proposed vs executed */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Scale className="size-3.5 text-teal-400" /> Proposed vs executed
              </h4>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5 text-xs">
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">1 · Agent proposed</p>
                {selectedCard?.payload?.recommendation ? (
                  <>
                    <p className="font-semibold text-teal-200">{selectedCard.payload.recommendation.team_name || selectedCard.proposed_team_id}</p>
                    {(selectedCard.payload.recommendation.reasons || []).map((r, i) => (
                      <p key={i} className="text-zinc-400 text-[11px]">✓ {r}</p>
                    ))}
                    {selectedDebate?.winner && (
                      <p className="font-mono text-[11px] text-amber-200">Debate: {selectedDebate.winner}</p>
                    )}
                  </>
                ) : (
                  <p className="text-zinc-500 text-[11px]">No proposal on record yet — triage still queued.</p>
                )}
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-1 text-xs">
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">2 · Decided</p>
                {selectedCard ? (
                  <p className="text-zinc-300 text-[11px]">
                    Card <span className="font-mono">{selectedCard.id}</span> — {selectedCard.state}
                    {selectedCard.decided_by ? <> by <b>{selectedCard.decided_by}</b></> : ' — awaiting decision'}
                  </p>
                ) : selectedApproval ? (
                  <p className="text-zinc-300 text-[11px]">
                    {selectedApproval.type === 'pending_action_approved' ? 'Approved' : 'Rejected'} — {selectedApproval.summary}
                  </p>
                ) : (
                  <p className="text-zinc-500 text-[11px]">No decision recorded yet.</p>
                )}
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-1 text-xs">
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">3 · Actually happened</p>
                {selected ? (
                  <p className="text-zinc-300 text-[11px]">
                    Status <b>{selected.status}</b>
                    {selected.assigned_team ? <> · team <b>{(teams.find((t) => t.id === selected.assigned_team) || {}).name || selected.assigned_team}</b> ({(teams.find((t) => t.id === selected.assigned_team) || {}).status || '?'})</> : ' · no team yet'}
                  </p>
                ) : (
                  <p className="text-zinc-300 text-[11px]">Rescued and off the queue — see timeline events.</p>
                )}
              </div>
            </div>

            {/* Debate transcript */}
            {selectedDebate?.verdict && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-3 space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                  Debate transcript — winner: {selectedDebate.winner || '—'}
                </p>
                <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedDebate.verdict}</p>
              </div>
            )}

            {/* Incident events */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-zinc-200">Ledger trail ({selectedEvents.length})</h4>
              {selectedEvents.length === 0 && <p className="text-[11px] text-zinc-500">No ledger rows for this SOS yet.</p>}
              {selectedEvents.map((e) => (
                <div key={e.id} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-teal-300">{e.type}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {e.ts ? new Date(Number(e.ts)).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">{e.summary}</p>
                </div>
              ))}
            </div>

            <a
              href={COORDINATOR_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-950/30 px-3 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-950/60 transition"
            >
              Open this in coordinator view <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
