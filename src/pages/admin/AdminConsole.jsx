import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api } from '../../api.js'
import { useAuth } from '../../AuthContext.jsx'
import MapView from '../../components/MapView.jsx'

const VIEWS = [
  ['dispatch', 'Dispatch', Radio],
  ['teams', 'Teams', ShieldCheck],
  ['people', 'People', Users],
  ['advisories', 'Advisories', Megaphone],
  ['assistant', 'Assistant', Bot],
]
const STATUS_FLOW = ['VERIFIED', 'PRIORITIZED', 'ASSIGNED', 'IN_PROGRESS', 'RESCUED', 'RESOLVED']
const CLOSED_STATUSES = new Set(['RESCUED', 'RESOLVED'])
const TEAM_STATUSES = ['AVAILABLE', 'ON_MISSION', 'RETURNING', 'OFFLINE']

const emptyTeam = {
  name: '',
  capacity: 4,
  status: 'AVAILABLE',
  lat: '',
  lng: '',
  label: '',
  contact: '',
  specialization: '',
  notes: '',
}

function scoreTone(score = 0) {
  if (score >= 8) return 'bg-red-500 text-white'
  if (score >= 5) return 'bg-amber-400 text-slate-950'
  return 'bg-sky-400 text-slate-950'
}

function statusTone(status) {
  const tones = {
    AVAILABLE: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/25',
    ON_MISSION: 'bg-sky-400/15 text-sky-200 ring-sky-400/25',
    RETURNING: 'bg-amber-400/15 text-amber-100 ring-amber-400/25',
    OFFLINE: 'bg-slate-500/15 text-slate-300 ring-slate-500/25',
    NEW: 'bg-red-400/15 text-red-100 ring-red-400/25',
    VERIFIED: 'bg-sky-400/15 text-sky-100 ring-sky-400/25',
    PRIORITIZED: 'bg-amber-400/15 text-amber-100 ring-amber-400/25',
    ASSIGNED: 'bg-violet-400/15 text-violet-100 ring-violet-400/25',
    IN_PROGRESS: 'bg-cyan-400/15 text-cyan-100 ring-cyan-400/25',
    RESCUED: 'bg-emerald-400/15 text-emerald-100 ring-emerald-400/25',
    RESOLVED: 'bg-slate-500/15 text-slate-300 ring-slate-500/25',
  }
  return tones[status] || tones.RESOLVED
}

function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  )
}

function Panel({ title, icon, action, children, className = '' }) {
  const Icon = icon
  return (
    <section className={`border border-slate-800 bg-slate-950 ${className}`}>
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
          {Icon && <Icon className="size-4 text-slate-400" />}
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 ${props.className || ''}`}
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 ${props.className || ''}`}
    />
  )
}

export default function AdminConsole() {
  const { user, signOut } = useAuth()
  const [view, setView] = useState('dispatch')
  const [summary, setSummary] = useState(null)
  const [board, setBoard] = useState([])
  const [mapData, setMapData] = useState({ incidents: [], teams: [], shelters: [], residents: [], areas: [] })
  const [teams, setTeams] = useState([])
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [teamForm, setTeamForm] = useState(emptyTeam)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantHistory, setAssistantHistory] = useState([])
  const [report, setReport] = useState({ title: '', body: '', severity: 'INFO', area_text: '', source: 'District Control Room' })

  async function load() {
    setError('')
    try {
      const [summaryRes, boardRes, mapRes, teamsRes, reportsRes] = await Promise.all([
        api.opsSummary(),
        api.actionBoard(),
        api.opsMapData(),
        api.opsTeams(),
        api.opsReports(),
      ])
      setSummary(summaryRes)
      setBoard(boardRes.incidents || [])
      setMapData(mapRes)
      setTeams(teamsRes.teams || [])
      setReports(reportsRes.reports || [])
      setSelectedId((current) => {
        const incidents = boardRes.incidents || []
        return incidents.some((item) => item.id === current) ? current : incidents[0]?.id || null
      })
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const selected = useMemo(
    () => board.find((item) => item.id === selectedId) || board[0] || null,
    [board, selectedId]
  )
  const visibleIncidents = useMemo(
    () => board.filter((item) => !CLOSED_STATUSES.has(item.status)),
    [board]
  )
  const mapLayers = useMemo(
    () => ({
      ...mapData,
      incidents: visibleIncidents,
      areas: visibleIncidents.length > 0 ? mapData.areas || [] : [],
    }),
    [mapData, visibleIncidents]
  )
  const recommendedTeam = selected?.recommendation?.team_id
    ? teams.find((team) => team.id === selected.recommendation.team_id)
    : null

  async function withBusy(label, fn) {
    setBusy(label)
    setError('')
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function createTeam(e) {
    e.preventDefault()
    await withBusy('team-create', async () => {
      const body = {
        name: teamForm.name,
        capacity: Number(teamForm.capacity),
        status: teamForm.status,
        contact: teamForm.contact,
        specialization: teamForm.specialization,
        notes: teamForm.notes,
      }
      if (teamForm.lat && teamForm.lng) {
        body.location = {
          lat: Number(teamForm.lat),
          lng: Number(teamForm.lng),
          label: teamForm.label,
        }
      }
      await api.createTeam(body)
      setTeamForm(emptyTeam)
    })
  }

  async function publishReport(e) {
    e.preventDefault()
    await withBusy('report', async () => {
      await api.publishReport(report)
      setReport({ title: '', body: '', severity: 'INFO', area_text: '', source: 'District Control Room' })
    })
  }

  async function sendAssistant(e) {
    e.preventDefault()
    const message = assistantInput.trim()
    if (!message) return
    const nextHistory = [...assistantHistory, { role: 'user', content: message }]
    setAssistantHistory(nextHistory)
    setAssistantInput('')
    setBusy('assistant')
    try {
      const res = await api.opsAssistant(message, nextHistory)
      setAssistantHistory([...nextHistory, { role: 'agent', content: res.reply }])
    } catch (err) {
      setAssistantHistory([...nextHistory, { role: 'agent', content: err.message }])
    } finally {
      setBusy('')
    }
  }

  const kpis = [
    ['Open incidents', summary?.active_incidents ?? 0],
    ['High priority', summary?.high_priority ?? 0],
    ['Teams ready', `${summary?.teams_ready ?? 0}/${summary?.teams_total ?? 0}`],
    ['People reported', summary?.people_reported ?? 0],
  ]

  return (
    <div className="admin-console min-h-svh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-red-500 text-white">
              <Radio className="size-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-[0.18em] text-white">RESQRA COMMAND</h1>
              <p className="text-[11px] text-slate-500">Patna flood response operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:bg-slate-900" aria-label="Refresh">
              <RefreshCw className="size-4" />
            </button>
            <span className="hidden text-[12px] text-slate-400 sm:inline">{user?.name || 'Control Room'}</span>
            <button onClick={signOut} className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:bg-slate-900" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-800 px-4 py-2">
          {VIEWS.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === id ? 'bg-slate-100 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
      </header>

      {error && <div className="border-b border-red-900/60 bg-red-950 px-4 py-2 text-sm text-red-100">{error}</div>}

      <main className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(([label, value]) => (
            <div key={label} className="border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {view === 'dispatch' && (
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(520px,1fr)_380px]">
            <QueuePanel board={board} selected={selected} onSelect={setSelectedId} />
            <Panel title="Live Map" icon={MapPin}>
              <div className="h-[620px]">
                <MapView
                  {...mapLayers}
                  height="100%"
                  onIncidentSelect={(incident) => setSelectedId(incident.id)}
                />
              </div>
            </Panel>
            <DecisionPanel
              selected={selected}
              recommendedTeam={recommendedTeam}
              busy={busy}
              onStatus={(status) => withBusy('status', () => api.setIncidentStatus(selected.id, status))}
              onAssign={() => withBusy('assign', () => api.assignTeam(selected.id, recommendedTeam.id))}
            />
          </div>
        )}

        {view === 'teams' && (
          <div className="grid gap-4 lg:grid-cols-[420px_minmax(480px,1fr)]">
            <Panel title="Add Rescue Team" icon={Plus}>
              <form onSubmit={createTeam} className="space-y-3 p-4">
                <Input required placeholder="Team name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input required type="number" min="1" placeholder="Capacity" value={teamForm.capacity} onChange={(e) => setTeamForm({ ...teamForm, capacity: e.target.value })} />
                  <select value={teamForm.status} onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                    {TEAM_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <Input placeholder="Contact number / radio channel" value={teamForm.contact} onChange={(e) => setTeamForm({ ...teamForm, contact: e.target.value })} />
                <Input placeholder="Specialization e.g. boat, medical, diving" value={teamForm.specialization} onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" step="any" placeholder="Latitude" value={teamForm.lat} onChange={(e) => setTeamForm({ ...teamForm, lat: e.target.value })} />
                  <Input type="number" step="any" placeholder="Longitude" value={teamForm.lng} onChange={(e) => setTeamForm({ ...teamForm, lng: e.target.value })} />
                </div>
                <Input placeholder="Base / current location label" value={teamForm.label} onChange={(e) => setTeamForm({ ...teamForm, label: e.target.value })} />
                <TextArea rows={3} placeholder="Notes" value={teamForm.notes} onChange={(e) => setTeamForm({ ...teamForm, notes: e.target.value })} />
                <button className="action-button w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" disabled={busy === 'team-create'}>
                  Add team
                </button>
              </form>
            </Panel>
            <Panel title="Team Directory" icon={ShieldCheck}>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {teams.map((team) => (
                  <div key={team.id} className="border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{team.name}</p>
                        <p className="mt-1 text-sm text-slate-400">Capacity {team.capacity} | rescued {team.rescued_total ?? 0}</p>
                      </div>
                      <Pill className={statusTone(team.status)}>{team.status}</Pill>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-400">
                      {team.contact && <p>Contact: {team.contact}</p>}
                      {team.specialization && <p>Specialization: {team.specialization}</p>}
                      {team.location?.label && <p>Location: {team.location.label}</p>}
                      {team.notes && <p>Notes: {team.notes}</p>}
                    </div>
                    <select
                      value={team.status}
                      onChange={(e) => withBusy(`team-${team.id}`, () => api.setTeamStatus(team.id, e.target.value))}
                      className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    >
                      {TEAM_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {view === 'people' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(520px,1fr)_420px]">
            <Panel title="People Map" icon={Users}>
              <div className="h-[620px]">
                <MapView {...mapLayers} height="100%" onIncidentSelect={(incident) => setSelectedId(incident.id)} />
              </div>
            </Panel>
            <Panel title="Resident Signals" icon={ListChecks}>
              <div className="max-h-[620px] overflow-y-auto p-4">
                {mapData.residents?.length === 0 && <p className="text-sm text-slate-500">No resident location signals yet.</p>}
                {mapData.residents?.map((person) => (
                  <div key={person.id} className="mb-3 border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{person.name || person.phone || person.id}</p>
                        <p className="text-sm text-slate-400">{person.location_text || person.location?.label || 'Device GPS location'}</p>
                      </div>
                      <Pill className={person.plot_source === 'stated_geocoded' ? statusTone('VERIFIED') : statusTone('PRIORITIZED')}>
                        {person.plot_source === 'stated_geocoded' ? 'stated' : 'gps'}
                      </Pill>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                      <Metric label="People" value={person.people_with ?? 'unknown'} />
                      <Metric label="Status" value={person.status || 'UNKNOWN'} />
                    </div>
                    {person.vulnerabilities?.length > 0 && <p className="mt-2 text-sm text-red-100">Needs: {person.vulnerabilities.join(', ')}</p>}
                    {person.phone && <p className="mt-1 text-sm text-slate-500">Phone: {person.phone}</p>}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {view === 'advisories' && (
          <div className="grid gap-4 lg:grid-cols-[440px_minmax(480px,1fr)]">
            <Panel title="Publish Public Advisory" icon={Megaphone}>
              <form onSubmit={publishReport} className="space-y-3 p-4">
                <Input required placeholder="Advisory title" value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} />
                <select value={report.severity} onChange={(e) => setReport({ ...report, severity: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                  <option>INFO</option>
                  <option>WARNING</option>
                  <option>CRITICAL</option>
                </select>
                <TextArea required rows={5} placeholder="Resident-facing update" value={report.body} onChange={(e) => setReport({ ...report, body: e.target.value })} />
                <Input placeholder="Area affected" value={report.area_text} onChange={(e) => setReport({ ...report, area_text: e.target.value })} />
                <button className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" disabled={busy === 'report'}>Publish advisory</button>
              </form>
            </Panel>
            <Panel title="Published Advisories" icon={Activity}>
              <div className="space-y-3 p-4">
                {reports.map((item) => (
                  <div key={item.id} className="border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{item.title}</p>
                      <Pill className={statusTone(item.severity === 'CRITICAL' ? 'NEW' : 'PRIORITIZED')}>{item.severity}</Pill>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
                    {item.area_text && <p className="mt-2 text-sm text-slate-500">Area: {item.area_text}</p>}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {view === 'assistant' && (
          <Panel title="Ops Assistant" icon={Bot}>
            <div className="flex min-h-[620px] flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {assistantHistory.length === 0 && <p className="max-w-xl rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm leading-relaxed text-slate-400">Ask for a situation summary, dispatch risks, or which incidents need human review.</p>}
                {assistantHistory.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`mb-3 max-w-3xl rounded-lg px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'ml-auto bg-sky-500 text-white' : 'bg-slate-900 text-slate-200'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>
              <form onSubmit={sendAssistant} className="flex gap-2 border-t border-slate-800 p-3">
                <Input value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} placeholder="Ask ops assistant" className="min-w-0 flex-1" />
                <button className="action-button grid size-10 place-items-center rounded-lg bg-sky-500 text-white" disabled={busy === 'assistant'} aria-label="Send">
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </Panel>
        )}
      </main>
    </div>
  )
}

function QueuePanel({ board, selected, onSelect }) {
  return (
    <Panel title="Rescue Queue" icon={AlertTriangle}>
      <div className="max-h-[620px] overflow-y-auto">
        {board.length === 0 && <p className="px-4 py-8 text-sm text-slate-500">No open incidents.</p>}
        {board.map((item) => {
          const score = item.priority?.score ?? 0
          const active = item.id === selected?.id
          return (
            <button key={item.id} onClick={() => onSelect(item.id)} className={`block w-full border-b border-slate-800 px-4 py-3 text-left transition ${active ? 'bg-slate-900' : 'hover:bg-slate-900/60'}`}>
              <div className="flex items-start gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${scoreTone(score)}`}>{score}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{item.id}</p>
                    <Pill className={statusTone(item.status)}>{item.status}</Pill>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">{item.raw_text}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill className="bg-slate-800 text-slate-300 ring-slate-700">{item.next_action}</Pill>
                    {item.flags?.slice(0, 2).map((flag) => <Pill key={flag} className="bg-red-400/10 text-red-100 ring-red-400/20">{flag.replaceAll('_', ' ')}</Pill>)}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

function DecisionPanel({ selected, recommendedTeam, busy, onStatus, onAssign }) {
  const actionDisabled = Boolean(busy)
  return (
    <Panel title="Decision Panel" icon={CheckCircle2}>
      {selected ? (
        <div className="space-y-4 p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">{selected.id}</h2>
              <Pill className={statusTone(selected.status)}>{selected.status}</Pill>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{selected.raw_text}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Score" value={selected.priority?.score ?? 0} />
            <Metric label="People" value={selected.people ?? 1} />
            <Metric label="Urgency" value={selected.urgency || 'NA'} />
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[12px] font-semibold uppercase text-slate-500">Recommended dispatch</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {selected.recommendation?.team_name || 'No eligible team'}
              {selected.recommendation?.eta_min != null && <span className="font-normal text-slate-400"> | ETA ~{selected.recommendation.eta_min} min</span>}
            </p>
            <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-slate-400">
              {selected.recommendation?.reasons?.slice(0, 5).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={selected.status} onChange={(e) => onStatus(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
              {STATUS_FLOW.map((status) => <option key={status}>{status}</option>)}
            </select>
            <button disabled={!recommendedTeam || actionDisabled} onClick={onAssign} className="action-button rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
              Assign best team
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={actionDisabled} onClick={() => onStatus('VERIFIED')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
              Verify
            </button>
            <button disabled={actionDisabled} onClick={() => onStatus('PRIORITIZED')} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50">
              Prioritize
            </button>
            <button disabled={actionDisabled} onClick={() => onStatus('IN_PROGRESS')} className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50">
              Mark in progress
            </button>
            <button disabled={actionDisabled} onClick={() => onStatus('RESOLVED')} className="action-button rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500">
              Resolve alert
            </button>
          </div>
        </div>
      ) : (
        <p className="p-4 text-sm text-slate-500">Select an incident to review.</p>
      )}
    </Panel>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <p className="text-[11px] uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
