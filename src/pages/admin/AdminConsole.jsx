import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Flame,
  FlaskConical,
  ImagePlus,
  Layers,
  Megaphone,
  MessageSquare,
  Mic,
  Pencil,
  Plus,
  Radio,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Square,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import { useAuth } from '../../AuthContext.jsx'
import MapView from '../../components/MapView.jsx'
import AgentOrb from '../../components/AgentOrb.jsx'
import GodEyesView from '../../components/GodEyesView.jsx'
import IncidentTimeline from '../../components/IncidentTimeline.jsx'
import useWebSocket from '../../hooks/useWebSocket.js'
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { CommandMenu } from '../../components/CommandMenu.jsx'
import { KpiDashboard } from '../../components/KpiDashboard.jsx'
import { DataTable } from '../../components/data-table/DataTable.jsx'
import { ColumnHeader } from '../../components/data-table/ColumnHeader.jsx'
import { Button } from '../../components/ui/button.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'

const STATUS_FLOW = ['NEW', 'UNVERIFIED', 'VERIFIED', 'PRIORITIZED', 'AWAITING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'RESCUED', 'RESOLVED']
const CLOSED_STATUSES = new Set(['RESCUED', 'RESOLVED'])
const TEAM_STATUSES = ['AVAILABLE', 'SOFT_RESERVED', 'ON_MISSION', 'RETURNING', 'UNAVAILABLE', 'OFFLINE']

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
  district: 'rautahat',
}

function scoreBadge(score = 0) {
  if (score >= 8) {
    return 'bg-gradient-to-br from-red-600 to-rose-600 text-white font-black shadow-[0_4px_14px_-2px_rgba(220,38,38,0.5)] ring-1 ring-red-600'
  }
  if (score >= 5) {
    return 'bg-amber-400 text-amber-950 font-bold'
  }
  return 'bg-slate-200 text-slate-600 font-medium border border-slate-300'
}

function statusPill(status) {
  const tones = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SOFT_RESERVED: 'bg-teal-50 text-teal-700 border-teal-200',
    APPROVED: 'bg-violet-50 text-violet-700 border-violet-200',
    ON_MISSION: 'bg-slate-900 text-white font-bold border-slate-900',
    RETURNING: 'bg-sky-50 text-sky-700 border-sky-200',
    UNAVAILABLE: 'bg-orange-50 text-orange-700 border-orange-200',
    OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200',
    NEW: 'bg-slate-100 text-slate-700 border-slate-300',
    UNVERIFIED: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    VERIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
    PRIORITIZED: 'bg-amber-100 text-amber-800 font-bold border-amber-300',
    AWAITING_ASSIGNMENT: 'bg-amber-50 text-amber-700 border-amber-200',
    ASSIGNED: 'bg-violet-100 text-violet-800 border-violet-300',
    IN_PROGRESS: 'bg-slate-900 text-white font-bold border-slate-900',
    RESCUED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RESOLVED: 'bg-slate-100 text-slate-500 border-slate-200',
    DUPLICATE: 'bg-slate-100 text-slate-400 border-slate-200',
    ESCALATED: 'bg-red-50 text-red-700 border-red-200',
    REOPENED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    INFO: 'bg-blue-50 text-blue-700 border-blue-200',
    WARNING: 'bg-amber-100 text-amber-800 font-bold border-amber-300',
    CRITICAL: 'bg-red-50 text-red-700 font-bold border-red-300',
  }
  return tones[status] || 'bg-slate-100 text-slate-600 border-slate-200'
}

export default function AdminConsole() {
  const { user, signOut } = useAuth()
  const [view, setView] = useState('dispatch')
  const [area, setArea] = useState('rautahat')
  const [areaConfig, setAreaConfig] = useState(null)
  const [summary, setSummary] = useState(null)
  const [board, setBoard] = useState([])
  const [mapData, setMapData] = useState({ incidents: [], teams: [], shelters: [], residents: [], areas: [], sensor_events: [] })
  const [teams, setTeams] = useState([])
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [queueFilter, setQueueFilter] = useState('ALL')
  const [inspectorTab, setInspectorTab] = useState('decision')
  const [teamForm, setTeamForm] = useState(emptyTeam)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantHistory, setAssistantHistory] = useState([])
  const [commandOpen, setCommandOpen] = useState(false)
  const [booting, setBooting] = useState(true)
  // Poll sequencing: overlapping 8s ticks + WS-triggered loads race —
  // only the newest load may write, and never after unmount.
  const loadSeq = useRef(0)
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])
  // Phase 2 chat sessions (lifted — view unmounts on switch)
  const [chatSessions, setChatSessions] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [report, setReport] = useState({ title: '', body: '', severity: 'INFO', area_text: '', source: 'Emergency Coordination Center' })
  const [layers, setLayers] = useState({
    heatmap: true, roads: true, incidents: true, teams: true,
    shelters: true, residents: true, areas: true,
    satellite: false, // NASA GIBS overlay — opt-in, advisory only
  })

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Load area configuration
  useEffect(() => {
    api.areaConfig(area).then(setAreaConfig).catch(() => {})
  }, [area])

  const roadBounds = useMemo(() => {
    if (areaConfig?.bounds) {
      return [areaConfig.bounds.sw, areaConfig.bounds.ne]
    }
    if (areaConfig?.center) {
      const c = areaConfig.center
      return [[c[0] - 0.08, c[1] - 0.10], [c[0] + 0.08, c[1] + 0.10]]
    }
    return [[26.62, 85.12], [26.98, 85.45]]
  }, [areaConfig])

  async function load() {
    // One slow/failed endpoint must never blank the whole console
    // (action-board once hung on routing fan-out and hid every layer).
    const my = ++loadSeq.current
    const [summaryRes, boardRes, mapRes, teamsRes, reportsRes] = await Promise.allSettled([
      api.opsSummary(),
      api.actionBoard(),
      api.opsMapData(),
      api.opsTeams(),
      api.opsReports(),
    ])
    // A newer load (poll tick or WS burst) already won — drop this one.
    // Never write state after unmount either.
    if (!mounted.current || my !== loadSeq.current) return
    try {
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
      if (boardRes.status === 'fulfilled') {
        setBoard(boardRes.value.incidents || [])
        setSelectedId((current) => {
          const incidents = boardRes.value.incidents || []
          return incidents.some((item) => item.id === current) ? current : incidents[0]?.id || null
        })
      }
      if (mapRes.status === 'fulfilled') setMapData(mapRes.value)
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.teams || [])
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.reports || [])
      const okCount = [summaryRes, boardRes, mapRes, teamsRes, reportsRes]
        .filter((r) => r.status === 'fulfilled').length
      // Honest sync stamp: only advance when at least one feed answered.
      if (okCount > 0) {
        setLastUpdate(Date.now())
      } else {
        toast.error('Ops feed unavailable', { description: 'All five feeds failed — check the backend.' })
      }
      for (const [name, res] of [['summary', summaryRes], ['board', boardRes], ['map', mapRes], ['teams', teamsRes], ['reports', reportsRes]]) {
        if (res.status === 'rejected') console.error(`load:${name}`, res.reason?.message || res.reason)
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (mounted.current) setBooting(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(() => { if (!document.hidden) load() }, 8000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area])

  // Live WebSocket Push — incremental apply, full reload only on reset/snapshot
  const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = typeof window !== 'undefined'
    ? ((import.meta.env.VITE_API_BASE_URL || '').replace(/^https?:\/\//, '') || window.location.host)
    : 'localhost:8000'
  const wsUrl = `${wsProtocol}//${wsHost}/ws/ops`
  const { connected: wsConnected, lastEvent: wsEvent } = useWebSocket(wsUrl)
  const [lastUpdate, setLastUpdate] = useState(null)

  function upsert(list, item, key = 'id') {
    const i = list.findIndex((x) => x[key] === item[key])
    if (i === -1) return [...list, item]
    const next = [...list]
    next[i] = { ...next[i], ...item }
    return next
  }

  useEffect(() => {
    if (!wsEvent) return
    const t = wsEvent?.type
    const d = wsEvent?.data || wsEvent?.payload || {}
    setLastUpdate(Date.now())

    if (t === 'snapshot') {
      load()
      return
    }
    if (t === 'SCENARIO_RESET') {
      load()
      toast.info('Scenario reset — reloaded baseline.')
      return
    }
    if (t === 'WORLD_SYNC_NOTICE') {
      // Rank conflict / override / closure from the sync layer: resync and
      // surface the summary — this is the coordinator's notification.
      load()
      const msg = d.summary || 'World state synchronized.'
      if (d.level === 'warning') toast.warning('Sync notice', { description: msg })
      else toast.info('Sync notice', { description: msg })
      return
    }
    if (t === 'TEAM_LOCATION_UPDATED' || t === 'team_location' || t === 'TEAM_STATUS_CHANGED' || t === 'team_status') {
      const team = d.team
      if (team?.id) {
        setTeams((prev) => upsert(prev, team))
        setMapData((prev) => ({ ...prev, teams: upsert(prev.teams || [], team) }))
      }
      return
    }
    if (t === 'INCIDENT_CREATED' || t === 'incident_created' || t === 'INCIDENT_UPDATED' || t === 'incident_status' || t === 'INCIDENT_PRIORITY_CHANGED') {
      const inc = d.incident
      if (inc?.id) {
        setBoard((prev) => upsert(prev, inc))
        setMapData((prev) => ({ ...prev, incidents: upsert(prev.incidents || [], inc) }))
      } else {
        load()
      }
      return
    }
    if (t === 'MISSION_CREATED' || t === 'MISSION_UPDATED' || t === 'dispatch' || t === 'HUMAN_APPROVAL' || t === 'HUMAN_REJECTION' || t === 'AGENT_RECOMMENDATION_CREATED') {
      load()
      if (t === 'MISSION_CREATED' || t === 'dispatch') {
        toast.dismiss()
        toast.success('Mission update live on map.')
      }
      return
    }
    if (t === 'SHELTER_CAPACITY_CHANGED' || t === 'shelter_occupancy') {
      const shelter = d.shelter
      if (shelter?.id) {
        setMapData((prev) => ({ ...prev, shelters: upsert(prev.shelters || [], shelter) }))
      }
      return
    }
    if (t === 'RESIDENT_UPDATED' || t === 'resident_updated') {
      const resident = d.resident
      if (resident?.id) {
        setMapData((prev) => ({ ...prev, residents: upsert(prev.residents || [], resident) }))
      }
      return
    }
    if (t && /WATER|FLOOD|ROAD|BRIDGE|COMMUNICATION/.test(t)) {
      load()
      return
    }
  }, [wsEvent])

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
      incidents: visibleIncidents,
      teams,
      shelters: mapData.shelters || [],
      residents: mapData.residents || [],
      sensor_events: mapData.sensor_events || [],
      areas: mapData.areas || [],
    }),
    [mapData, visibleIncidents, teams]
  )
  const recommendedTeam = selected?.recommendation?.team_id
    ? teams.find((team) => team.id === selected.recommendation.team_id)
    : null

  const [teamDistrictFilter, setTeamDistrictFilter] = useState('ALL')

  const filteredTeams = useMemo(() => {
    if (teamDistrictFilter === 'ALL') return teams
    return teams.filter(
      (t) => (t.district || 'rautahat').toLowerCase() === teamDistrictFilter.toLowerCase()
    )
  }, [teams, teamDistrictFilter])

  const filteredBoard = useMemo(() => {
    return board.filter((item) => {
      if (queueFilter === 'THIS_DISTRICT' && item.district && item.district !== area) return false
      if (queueFilter === 'CRITICAL' && (item.priority?.score ?? 0) < 8) return false
      if (queueFilter === 'WATER_RISING' && !item.flags?.includes('water_rising') && !item.water_rising) return false
      if (queueFilter === 'PENDING' && !(item.pending_actions || []).some((p) => p.state === 'PENDING')) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          item.id?.toLowerCase().includes(q) ||
          item.raw_text?.toLowerCase().includes(q) ||
          item.location_text?.toLowerCase().includes(q) ||
          item.district?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [board, queueFilter, searchQuery, area])

  async function withBusy(label, fn, successMsg) {
    setBusy(label)
    try {
      const out = await fn()
      if (successMsg) toast.success(successMsg)
      await load()
      return out
    } catch (err) {
      toast.error('Action Failed', { description: err.message })
      return undefined
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
        district: (teamForm.district || 'rautahat').toLowerCase(),
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
      toast.success('Rescue Asset Registered', { description: `${body.name} ready for assignment.` })
    })
  }

  async function publishReport(e) {
    e.preventDefault()
    await withBusy('report', async () => {
      await api.publishReport(report)
      setReport({ title: '', body: '', severity: 'INFO', area_text: '', source: 'Emergency Coordination Center' })
      toast.success('Official Bulletin Transmitted', { description: report.title })
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
    // Phase 6 area-aware context (§8.4): preset + bounds + focus go explicitly.
    // Phase 3: a marked region overrides the area bounds for scoping.
    const area_context = {
      area,
      bounds: markedRegion || roadBounds,
      region_marked: Boolean(markedRegion),
      incident_id: selected?.id || null,
    }
    try {
      const res = await api.opsAssistant(message, nextHistory, area_context)
      const tools = res.tools_called?.length ? ` [tools: ${res.tools_called.join(', ')}]` : ''
      setAssistantHistory([...nextHistory, { role: 'agent', content: `${res.reply}${tools}` }])
    } catch (err) {
      setAssistantHistory([...nextHistory, { role: 'agent', content: err.message }])
    } finally {
      setBusy('')
    }
  }

  const [routePreview, setRoutePreview] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)
  const [stability, setStability] = useState(null)
  // Phase 3 region marking: two clicks on the tactical map scope the agent.
  const [regionMode, setRegionMode] = useState(false)
  const [markedRegion, setMarkedRegion] = useState(null)

  async function handleReevaluate() {
    if (!selected) return
    setBusy('recommend')
    try {
      const res = await api.recommendTeam(selected.id)
      if (res.stability) {
        setStability({ incident: selected.id, ...res.stability })
        const verdict = res.stability.verdict
        if (verdict === 'STABLE') toast.info('Re-evaluated: plan holds', { description: res.stability.note })
        else if (verdict === 'REPLANNED') toast.warning('Re-planned by agents', { description: res.stability.note })
        else if (verdict === 'INVALIDATED') toast.error('Plan invalidated', { description: res.stability.note })
        else toast.info('No eligible team', { description: res.stability.note })
      }
      await load()
    } catch (err) {
      toast.error('Action Failed', { description: err.message })
    } finally {
      setBusy('')
    }
  }

  // Route preview follows the selected incident (recommended or assigned
  // team). Side-effect free: no holds, no cards, map detail only.
  useEffect(() => {
    const teamId = selected?.recommendation?.team_id || selected?.assigned_team
    if (!selected?.id || !selected?.location) {
      setRoutePreview(null)
      setRouteError(null)
      return
    }
    // Clear instantly so the previous SOS's line never lingers.
    setRoutePreview(null)
    setRouteError(null)
    let cancelled = false
    setRouteLoading(true)
    api.routePreview(selected.id, teamId)
      .then((res) => { if (!cancelled) setRoutePreview(res) })
      .catch((err) => { if (!cancelled) { setRoutePreview(null); setRouteError(err.message) } })
      .finally(() => { if (!cancelled) setRouteLoading(false) })
    return () => { cancelled = true }
  }, [selected?.id, selected?.recommendation?.team_id, selected?.assigned_team, selected?.location?.lat, selected?.location?.lng])

  // TanStack Table columns for Rescue Fleet
  const teamColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <ColumnHeader column={column} title="Callsign / Asset" />,
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-900 text-xs">{row.original.name}</div>
            <div className="font-mono text-[10px] text-slate-500">{row.original.specialization || 'Water Rescue'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'district',
        header: ({ column }) => <ColumnHeader column={column} title="Madhesh Corridor" />,
        cell: ({ row }) => {
          const d = (row.original.district || 'rautahat').toUpperCase()
          return (
            <Badge variant="outline" className="font-mono text-[10px] uppercase border-slate-300 text-slate-600">
              🇳🇵 {d}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge className={statusPill(row.original.status)}>{row.original.status}</Badge>,
      },
      {
        accessorKey: 'capacity',
        header: ({ column }) => <ColumnHeader column={column} title="Capacity" />,
        cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-900">{row.original.capacity} seats</span>,
      },
      {
        accessorKey: 'rescued_total',
        header: ({ column }) => <ColumnHeader column={column} title="Rescued" />,
        cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{row.original.rescued_total ?? 0}</span>,
      },
      {
        accessorKey: 'contact',
        header: ({ column }) => <ColumnHeader column={column} title="Comms" />,
        cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.contact || 'Radio'}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="font-mono text-[10px] uppercase font-bold text-slate-500">Override</span>,
        cell: ({ row }) => (
          <select
            value={row.original.status}
            onChange={(e) => withBusy(`team-${row.original.id}`, () => api.setTeamStatus(row.original.id, e.target.value))}
            className="rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
          >
            {TEAM_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        ),
      },
    ],
    []
  )

  return (
    <AdminLayout
      currentView={view}
      onViewChange={setView}
      area={area}
      onAreaChange={setArea}
      onOpenCommand={() => setCommandOpen(true)}
      onRefresh={load}
      busy={busy}
      user={user}
      onSignOut={signOut}
      wsConnected={wsConnected}
      lastUpdate={lastUpdate}
    >
      {/* Global ⌘K Command Menu */}
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        incidents={board}
        teams={teams}
        onSelectIncident={(id) => {
          setSelectedId(id)
          setView('dispatch')
        }}
        onSelectTeam={(id) => setView('teams')}
        onTriggerSweep={async () => {
          await api.triggerAgentSweep()
          toast.success('Agent Sweep Triggered')
          load()
        }}
        onRecomputeRisk={async () => {
          await api.recomputeDensityRisk()
          toast.success('Risk Clusters Recomputed')
          load()
        }}
        onNavigateTab={(tab) => setView(tab)}
      />

      {/* ========================================================================= */}
      {/* VIEW 0: AI CHAT SESSIONS                                                    */}
      {/* ========================================================================= */}
      {view === 'chat' && (
        <AIChatView
          sessions={chatSessions}
          setSessions={setChatSessions}
          activeId={activeChatId}
          setActiveId={setActiveChatId}
          messages={chatMessages}
          setMessages={setChatMessages}
          area={area}
          roadBounds={roadBounds}
          markedRegion={markedRegion}
          selectedId={selected?.id || null}
          busy={busy}
          setBusy={setBusy}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: TACTICAL MAP COCKPIT (CLEAN 3-COLUMN NON-OVERLAPPING WORKSPACE)   */}
      {/* ========================================================================= */}
      {view === 'dispatch' && booting && board.length === 0 && (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[330px_minmax(420px,1fr)_380px] h-auto lg:h-[calc(100vh-80px)]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="ops-skeleton h-6 w-2/3 rounded" />
              <div className="ops-skeleton h-40 rounded-xl" />
              <div className="ops-skeleton h-4 w-1/2 rounded" />
              <div className="ops-skeleton h-24 rounded-xl" />
            </div>
          ))}
        </div>
      )}
      {view === 'dispatch' && !(booting && board.length === 0) && (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[330px_minmax(420px,1fr)_380px] h-auto lg:h-[calc(100vh-80px)] lg:min-h-[580px]">
          
          {/* COLUMN 1: LIVE SOS TRIAGE QUEUE */}
          <Card className="h-full flex flex-col bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-white border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-[13px] font-bold">
                <span className="grid size-6 place-items-center rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="size-3.5 text-red-600" />
                </span>
                SOS Triage Queue
              </CardTitle>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">{filteredBoard.length} open</span>
            </CardHeader>

            {/* Search & Filter Bar */}
            <div className="p-2 border-b border-slate-200 bg-slate-100 space-y-1.5">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                <Search className="size-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter incidents (⌘K)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none w-full font-mono"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-900">
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex gap-1 font-mono text-[9px] uppercase font-bold">
                {[
                  ['ALL', 'All'],
                  ['CRITICAL', 'Critical (≥8)'],
                  ['WATER_RISING', 'Rising'],
                  ['PENDING', 'Gate Ready'],
                  ['THIS_DISTRICT', 'District'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setQueueFilter(key)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      queueFilter === key
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Incidents List */}
            <div className="divide-y divide-slate-200/60 overflow-y-auto flex-1">
              {filteredBoard.length === 0 && (
                <div className="p-6 text-center font-mono text-xs text-slate-500">
                  No incidents match current filter.
                </div>
              )}
              {filteredBoard.map((item) => {
                const score = item.priority?.score ?? 0
                const active = item.id === selected?.id
                const hasPending = (item.pending_actions || []).some((p) => p.state === 'PENDING')
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    aria-selected={active}
                    className={`block w-full border-b border-slate-100 p-2.5 text-left transition ${
                      active
                        ? 'bg-slate-900/[0.04] shadow-[inset_3px_0_0_0_#0f172a]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`tnum grid size-7 shrink-0 place-items-center rounded-lg font-mono text-xs ${scoreBadge(score)}`}>
                        {score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">{item.id}</span>
                          <Badge className={statusPill(item.status)}>{item.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                          {item.raw_text}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono text-[9px]">
                          <span className="rounded bg-slate-100 px-1 py-0.5 text-slate-500 border border-slate-200">
                            👥 {item.people ?? 1}
                          </span>
                          {hasPending && (
                            <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-900">
                              ⚡ GATE READY
                            </span>
                          )}
                          {item.water_rising && (
                            <span className="rounded bg-slate-200 px-1 py-0.5 text-slate-700 border border-slate-300">
                              🌊 Rising
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* COLUMN 2: FULL-BLEED RESPONSIVE WAR ROOM MAP */}
          <div className="relative rounded-xl border border-slate-200 overflow-hidden shadow-2xl h-[420px] lg:h-full">
            <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5">
              <button
                onClick={() => setRegionMode((v) => !v)}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-xl backdrop-blur transition ${
                  regionMode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white/95 text-slate-500 hover:text-slate-900'
                }`}
              >
                {regionMode ? 'Click 2 corners… (cancel)' : 'Mark region'}
              </button>
              {markedRegion && (
                <button
                  onClick={() => setMarkedRegion(null)}
                  className="rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 font-mono text-[10px] text-slate-500 hover:text-red-600"
                >
                  Clear ✕
                </button>
              )}
            </div>
            <MapView
              {...mapLayers}
              sensorEvents={mapLayers.sensor_events}
              height="100%"
              darkTiles={false}
              onIncidentSelect={(incident) => setSelectedId(incident.id)}
              selectedIncidentId={selected?.id}
              routeDetail={routePreview}
              routeLoading={routeLoading}
              regionMode={regionMode}
              markedRegion={markedRegion}
              onRegionSelect={(bounds) => {
                setMarkedRegion(bounds)
                setRegionMode(false)
                toast.info('Region marked — agent answers scope here.')
              }}
              areaCenter={areaConfig?.center || [26.7640, 85.2780]}
              areaBounds={roadBounds}
              visibleLayers={layers}
              onLayerToggle={toggleLayer}
            />
          </div>

          {/* COLUMN 3: INSPECTOR & ACTION COCKPIT */}
          <Card className="h-full flex flex-col bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-white border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-[13px] font-bold">
                <span className="grid size-6 place-items-center rounded-lg bg-slate-900">
                  <CheckCircle2 className="size-3.5 text-white" />
                </span>
                Decision Cockpit
              </CardTitle>
              <div className="flex gap-1 font-mono text-[10px]">
                {['decision', 'agent_trace', 'timeline', 'copilot'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setInspectorTab(t)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      inspectorTab === t ? 'bg-slate-900 text-white font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t === 'decision' ? 'Gate' : t === 'agent_trace' ? 'Trace' : t === 'timeline' ? 'Audit' : 'AI'}
                  </button>
                ))}
              </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto">
              {inspectorTab === 'decision' && (
                <DecisionCockpit
                  key={selected?.id || 'none'}
                  selected={selected}
                  recommendedTeam={recommendedTeam}
                  teams={teams}
                  busy={busy}
                  routePreview={routePreview}
                  routeLoading={routeLoading}
                  routeError={routeError}
                  stability={stability}
                  onStatus={(status) => withBusy('status', () => api.setIncidentStatus(selected.id, status), `Status → ${status}`)}
                  onAssign={(teamId) => withBusy('assign', () => api.assignTeam(selected.id, teamId), `Team dispatched: ${(teams.find((t) => t.id === teamId) || {}).name || teamId}`)}
                  onRecommend={handleReevaluate}
                  onDecide={(pendingId, decision) =>
                    withBusy('decide', async () => {
                      await api.decidePendingAction(pendingId, { decision })
                    }, decision === 'APPROVED' ? 'Dispatch approved — mission live on map' : 'Dispatch rejected — team released')
                  }
                />
              )}

              {inspectorTab === 'agent_trace' && (
                <AgentTraceTab selected={selected} />
              )}

              {inspectorTab === 'timeline' && (
                <div className="p-3">
                  {selected ? (
                    <IncidentTimeline incidentId={selected.id} />
                  ) : (
                    <div className="text-center font-mono text-xs text-slate-500 py-8">Select an incident to view audit stream</div>
                  )}
                </div>
              )}

              {inspectorTab === 'copilot' && (
                <CopilotTab
                  assistantHistory={assistantHistory}
                  assistantInput={assistantInput}
                  setAssistantInput={setAssistantInput}
                  sendAssistant={sendAssistant}
                  busy={busy}
                  area={area}
                />
              )}
            </div>
          </Card>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1b: GOD EYES — NEPAL-LOCKED SPATIAL INTELLIGENCE (GEV)          */}
      {/* Isolated tab: satellite + sensors + click-to-track, same live state */}
      {/* ========================================================================= */}
      {view === 'godeyes' && (
        <GodEyesView
          incidents={visibleIncidents}
          teams={teams}
          shelters={mapData.shelters || []}
          residents={mapData.residents || []}
          areas={mapData.areas || []}
          sensorEvents={mapData.sensor_events || []}
          selectedIncidentId={selected?.id}
          onIncidentSelect={(incident) => setSelectedId(incident.id)}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SITUATIONAL ANALYTICS & KPIS (RECHARTS)                           */}
      {/* ========================================================================= */}
      {view === 'kpis' && (
        <div className="space-y-4">
          <KpiDashboard incidents={board} teams={teams} summary={summary} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: RESCUE FLEET DIRECTORY (TANSTACK DATA TABLE)                      */}
      {/* ========================================================================= */}
      {view === 'teams' && (
        <div className="space-y-4 font-sans">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-mono text-base font-bold text-slate-900">Rescue Fleet Roster & Readiness</h2>
              <p className="text-xs text-slate-500">Sortable live directory of registered rescue boats and disaster battalions</p>
            </div>

            {/* Corridor District Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-500 uppercase font-bold text-[10px] mr-1">Rautahat Fleet:</span>
              {[
                ['ALL', `All Units (${teams.length})`],
                ['rautahat', `Rautahat District (${teams.filter(t => t.district === 'rautahat').length})`],
              ].map(([k, label]) => (
                <Button
                  key={k}
                  variant={teamDistrictFilter === k ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs font-mono"
                  onClick={() => setTeamDistrictFilter(k)}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant={showAddTeam ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs font-mono"
                onClick={() => setShowAddTeam((v) => !v)}
              >
                {showAddTeam ? 'Close' : '+ Register Team'}
              </Button>
            </div>
          </div>
          {showAddTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Ship className="size-3.5 text-slate-500" /> Register Rescue Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    await createTeam(e)
                    setShowAddTeam(false)
                  }}
                  className="grid gap-2.5 sm:grid-cols-2"
                >
                  <input required minLength={2} placeholder="Team name *" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none sm:col-span-2" />
                  <label className="text-[11px] font-medium text-slate-500">Capacity (seats) *
                    <input required type="number" min={1} max={500} value={teamForm.capacity} onChange={(e) => setTeamForm({ ...teamForm, capacity: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none" />
                  </label>
                  <label className="text-[11px] font-medium text-slate-500">Status
                    <select value={teamForm.status} onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none">
                      {['AVAILABLE', 'RETURNING', 'UNAVAILABLE', 'OFFLINE'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <input placeholder="Specialization (e.g. medical triage boat)" value={teamForm.specialization} onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="Contact (radio / phone)" value={teamForm.contact} onChange={(e) => setTeamForm({ ...teamForm, contact: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="Station latitude (e.g. 26.7660)" inputMode="decimal" value={teamForm.lat} onChange={(e) => setTeamForm({ ...teamForm, lat: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="Station longitude (e.g. 85.2760)" inputMode="decimal" value={teamForm.lng} onChange={(e) => setTeamForm({ ...teamForm, lng: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="Station label (e.g. Ward 4 boat station)" value={teamForm.label} onChange={(e) => setTeamForm({ ...teamForm, label: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="District (default rautahat)" value={teamForm.district} onChange={(e) => setTeamForm({ ...teamForm, district: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <input placeholder="Notes (station, coverage, equipment)" value={teamForm.notes} onChange={(e) => setTeamForm({ ...teamForm, notes: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none sm:col-span-2" />
                  <Button type="submit" disabled={busy === 'team-create' || !teamForm.name.trim()} className="font-mono text-xs font-bold sm:col-span-2">
                    {busy === 'team-create' ? 'Registering…' : 'Register Team'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <DataTable columns={teamColumns} data={filteredTeams} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: BULLETINS & OFFICIAL ADVISORIES                                  */}
      {/* ========================================================================= */}
      {view === 'advisories' && (
        <div className="grid gap-4 lg:grid-cols-[400px_minmax(480px,1fr)]">
          <Card className="bg-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs">
                <Megaphone className="size-3.5 text-slate-500" /> Transmit Emergency Bulletin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={publishReport} className="space-y-3">
                <input required placeholder="Bulletin headline" value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-900" />
                <select value={report.severity} onChange={(e) => setReport({ ...report, severity: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-xs text-slate-900">
                  <option>INFO</option>
                  <option>WARNING</option>
                  <option>CRITICAL</option>
                </select>
                <textarea required rows={5} placeholder="Full emergency instructions for citizens..." value={report.body} onChange={(e) => setReport({ ...report, body: e.target.value })} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-900" />
                <input placeholder="Affected regions / wards" value={report.area_text} onChange={(e) => setReport({ ...report, area_text: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-900" />
                <Button className="w-full font-mono text-xs font-bold" disabled={busy === 'report'}>
                  Transmit Bulletin
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs">
                <Activity className="size-3.5 text-slate-500" /> Active Transmissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                    <Badge className={statusPill(item.severity || 'INFO')}>{item.severity}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
                  {item.area_text && <p className="mt-2 font-mono text-[11px] text-slate-500">Target: {item.area_text}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating voice console — all coordinator views */}
      {view === 'simulation' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-bold">Simulation Studio lives in the Demo Client.</p>
          <p className="mt-1 text-xs text-amber-800">This console shows live operations only. Use sensor spikes via the judge simulator (POST /api/simulation/events) — events appear here through the realtime gateway.</p>
        </div>
      )}
      <AgentOrb
        area={area}
        roadBounds={markedRegion || roadBounds}
        selectedId={selected?.id || null}
        busy={busy}
        setBusy={setBusy}
        onFocusIncident={(id) => {
          setSelectedId(id)
          setView('dispatch')
        }}
        onNavigate={(tab) => setView(tab)}
        onMarkRegion={() => {
          setView('dispatch')
          setRegionMode(true)
          toast.info('Region mode on — click two corners on the map.')
        }}
      />

    </AdminLayout>
  )
}

// ---------------------------------------------------------------------------
// DECISION COCKPIT (1-CLICK GATE & OVERRIDES)
// ---------------------------------------------------------------------------
function DecisionCockpit({ selected, recommendedTeam, teams, busy, onStatus, onAssign, onRecommend, onDecide, routePreview, routeLoading, routeError, stability }) {
  const [manualTeamId, setManualTeamId] = useState('')
  const [debate, setDebate] = useState(null)
  const [debateLoading, setDebateLoading] = useState(false)
  const [debateOpen, setDebateOpen] = useState(false)
  const actionDisabled = Boolean(busy)
  const pendingCard = (selected?.pending_actions || []).find((c) => c.state === 'PENDING')

  if (!selected) {
    return <div className="p-6 text-center font-mono text-xs text-slate-500">Select an incident from queue.</div>
  }

  return (
    <div className="p-3 space-y-3">
      {/* Selected Incident Header */}
      <div className="border-b border-slate-200 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-slate-900">{selected.id}</span>
          <Badge className={statusPill(selected.status)}>{selected.status}</Badge>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
          {selected.raw_text}
        </p>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span>📍 {selected.location_text || selected.location?.label || 'GPS Location'}</span>
          <span>👥 {selected.people ?? 1} people</span>
        </div>
      </div>

      {/* 1-CLICK APPROVAL GATE CARD */}
      {pendingCard ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-900/80 bg-gradient-to-b from-white to-slate-50 p-3 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)] space-y-2">
          <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 via-red-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-900">
              <span className="size-2 rounded-full bg-slate-100 animate-pulse" />
              Supervisor Approval Gate
            </span>
            <span className="font-mono text-[9px] text-slate-500">{pendingCard.id}</span>
          </div>

          <div className="rounded bg-slate-100 p-2 border border-slate-200">
            <p className="text-xs font-bold text-slate-900">
              Proposed Asset: <span className="text-slate-700">{selected.recommendation?.team_name || pendingCard.proposed_team_id}</span>
            </p>
            <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-slate-500">
              {(pendingCard.reasons || selected.recommendation?.reasons || []).slice(0, 3).map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Button
              disabled={actionDisabled}
              onClick={() => onDecide(pendingCard.id, 'APPROVED')}
              variant="default"
              size="sm"
              className="font-mono text-xs font-bold"
            >
              ✓ APPROVE
            </Button>
            <Button
              disabled={actionDisabled}
              onClick={() => onDecide(pendingCard.id, 'REJECTED')}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              ✕ REJECT
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase text-slate-500">Agent Recommendation</span>
            <button
              disabled={actionDisabled}
              onClick={onRecommend}
              className="font-mono text-[10px] font-bold text-slate-900 hover:underline"
            >
              Re-evaluate
            </button>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {selected.recommendation?.team_name || 'No eligible asset currently'}
            {selected.recommendation?.eta_min != null && <span className="font-normal text-slate-500"> (ETA ~{selected.recommendation.eta_min}m)</span>}
          </p>
          <ul className="space-y-0.5 font-mono text-[10px] text-slate-500">
            {selected.recommendation?.reasons?.slice(0, 3).map((r) => <li key={r}>• {r}</li>)}
          </ul>
          {stability && stability.incident === selected.id && (
            <p className={`rounded-lg px-2 py-1.5 font-mono text-[10px] leading-snug ${
              stability.verdict === 'STABLE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : stability.verdict === 'REPLANNED' ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {stability.verdict === 'STABLE' ? '✓ ' : stability.verdict === 'REPLANNED' ? '⟳ ' : '! '}
              {stability.note}
            </p>
          )}
        </div>
      )}

      {/* Best-route detail (preview follows selection, no side effects) */}
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">Best Route Detail</span>
          {routeLoading && <span className="text-[10px] text-slate-400">loading…</span>}
        </div>
        {!routePreview && !routeLoading && !routeError && (
          <p className="text-[11px] text-slate-500">Select an SOS with a team to see the route.</p>
        )}
        {routeError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-2 py-1.5 text-[11px] text-red-700">
            Route unavailable: {routeError}
          </p>
        )}
        {routePreview && (
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <p><b className="text-slate-800">{routePreview.team?.name}</b> → incident ·{' '}
              {routePreview.routes?.filter((r) => r.feasible)
                .map((r) => `${r.id} (${r.distance_km} km)`).join(', ') || 'no feasible route'}
            </p>
            {routePreview.explanation?.explanation && (
              <p className="leading-snug text-slate-600">{routePreview.explanation.explanation}</p>
            )}
            {(routePreview.explanation?.invalid || []).length > 0 && (
              <ul className="space-y-0.5 text-red-700">
                {routePreview.explanation.invalid.map((b) => (
                  <li key={b.id}>✗ {b.id}: {b.reason}</li>
                ))}
              </ul>
            )}
            {routePreview.shelter_leg && (
              <p className="text-emerald-800">
                ⛺ Evac leg → {routePreview.shelter_leg.shelter?.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* LLM debate: advocates argue live facts, judge picks — read-only */}
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">LLM Debate</span>
          <button
            disabled={actionDisabled || debateLoading}
            onClick={async () => {
              setDebateLoading(true)
              try {
                const res = await api.debate(selected.id)
                setDebate(res)
                setDebateOpen(true)
              } catch (err) {
                toast.error('Debate failed', { description: err.message })
              } finally {
                setDebateLoading(false)
              }
            }}
            className="font-mono text-[10px] font-bold text-slate-900 hover:underline disabled:opacity-50"
          >
            {debateLoading ? 'Debating…' : debate ? 'Re-debate' : 'Start debate'}
          </button>
        </div>
        {!debate && !debateLoading && (
          <p className="text-[11px] text-slate-500">Dispatch vs shelter advocates, judged on live data. Nothing executes.</p>
        )}
        {debate && (
          <div className="space-y-1.5">
            <p className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${
              debate.winner === 'DISPATCH'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              Judge: {debate.winner} — {(debate.verdict || '').replace(/^WINNER:\s*\w+\s*/i, '').slice(0, 220)}
            </p>
            <button
              onClick={() => setDebateOpen((v) => !v)}
              className="font-mono text-[10px] text-slate-500 hover:text-slate-800"
            >
              {debateOpen ? 'Hide transcript' : `Show transcript (${debate.transcript?.length || 0} turns)`}
            </button>
            {debateOpen && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {(debate.transcript || []).map((t, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-slate-500">{t.role?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-slate-700 leading-snug whitespace-pre-wrap">{t.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Priority Breakdown Matrix */}
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">F03 Priority Factor Math</span>
          <span className="font-bold text-slate-900">{selected.priority?.score ?? 0}/10</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
          <div>Urgency: <b className="text-slate-700">{selected.urgency || 'MEDIUM'}</b></div>
          <div>Water Rising: <b className="text-slate-700">{selected.water_rising ? 'YES' : 'NO'}</b></div>
          <div>Vulnerabilities: <b className="text-slate-700">{selected.vulnerabilities?.length || 0}</b></div>
          <div>Location: <b className="text-slate-700">{selected.location ? 'GEOCODED' : 'UNRESOLVED'}</b></div>
        </div>
      </div>

      {/* Commander Manual Overrides */}
      <div className="space-y-1.5 pt-1 border-t border-slate-200">
        <span className="font-mono text-[10px] uppercase font-bold text-slate-500">Manual Override</span>
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={selected.status}
            onChange={(e) => onStatus(e.target.value)}
            className="rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
          >
            {STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-1">
            <select
              value={manualTeamId}
              onChange={(e) => setManualTeamId(e.target.value)}
              className="rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 flex-1 min-w-0"
            >
              <option value="">Direct boat...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} (Cap {t.capacity})</option>
              ))}
            </select>
            <Button
              disabled={!manualTeamId || actionDisabled}
              onClick={() => onAssign(manualTeamId)}
              variant="default"
              size="sm"
              className="h-7 px-2 font-mono text-[10px] font-bold"
            >
              Dispatch
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AGENT TRACE TAB
// ---------------------------------------------------------------------------
function AgentTraceTab({ selected }) {
  if (!selected) return <div className="p-4 font-mono text-xs text-slate-500">No incident selected</div>

  return (
    <div className="p-3 space-y-3 font-mono text-xs">
      <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[10px] uppercase font-bold text-slate-900 flex items-center gap-1.5">
            <Cpu className="size-3.5" /> 1. IntakeAgent NLP Extraction
          </span>
          <span className="text-[10px]">Confidence: 96%</span>
        </div>
        <div className="rounded bg-slate-50 p-2 text-[11px] text-slate-600 space-y-0.5">
          <p>• People extracted: <b>{selected.people ?? 1}</b></p>
          <p>• Urgency tag: <b>{selected.urgency || 'MEDIUM'}</b></p>
          <p>• Vulnerabilities: <b>{selected.vulnerabilities?.join(', ') || 'None stated'}</b></p>
          <p>• Water rising flag: <b>{selected.water_rising ? 'TRUE' : 'FALSE'}</b></p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[10px] uppercase font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="size-3.5" /> 2. Priority Engine (Deterministic Math)
          </span>
          <span className="text-[10px]">Formula: F03</span>
        </div>
        <div className="rounded bg-slate-50 p-2 text-[11px] text-slate-600 space-y-0.5">
          <p>• Final Score: <b>{selected.priority?.score ?? 0}/10</b></p>
          <p>• Scoring Factors:</p>
          <ul className="pl-3 space-y-0.5 text-slate-500">
            {selected.priority?.reasons?.map((r, i) => <li key={i}>- {r}</li>) || <li>- Base calculated</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[10px] uppercase font-bold text-slate-900 flex items-center gap-1.5">
            <Ship className="size-3.5" /> 3. Allocation Engine & RejectionMemory
          </span>
        </div>
        <div className="rounded bg-slate-50 p-2 text-[11px] text-slate-600 space-y-0.5">
          <p>• Candidate Asset: <b>{selected.recommendation?.team_name || 'None'}</b></p>
          <p>• Anti-Looping History: <b>0 rejections on file</b></p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// COPILOT TAB
// ---------------------------------------------------------------------------
function CopilotTab({ assistantHistory, assistantInput, setAssistantInput, sendAssistant, busy, area }) {
  const areaLabel = area || 'this area'
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {assistantHistory.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs text-slate-500 space-y-2 font-mono">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Ops Intelligence Assistant
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Grounded in live world state for {areaLabel}. Cites real IDs; recommends, never executes.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                `What is happening in ${areaLabel}?`,
                'Which teams are nearby and available?',
                'Which shelters have free capacity?',
                'Which roads are blocked?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setAssistantInput(prompt)}
                  className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200 border border-slate-200"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
        {assistantHistory.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-xs leading-relaxed font-mono ${
              msg.role === 'user'
                ? 'ml-auto max-w-[85%] bg-slate-900 text-white font-medium'
                : 'bg-slate-100 text-slate-700 border border-slate-200 max-w-[95%]'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendAssistant} className="flex gap-1.5 border-t border-slate-200 p-2 bg-slate-100">
        <input
          value={assistantInput}
          onChange={(e) => setAssistantInput(e.target.value)}
          placeholder="Ask copilot with live DB context..."
          className="min-w-0 flex-1 font-mono text-xs rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-900 placeholder:text-slate-600 focus:outline-none"
        />
        <Button
          type="submit"
          disabled={busy === 'assistant' || !assistantInput.trim()}
          size="sm"
          className="size-8 p-0"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI CHAT VIEW (Phase 2: multi-session coordinator chat, server history)
// ---------------------------------------------------------------------------
function WorkingLine({ since }) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    setSecs(0)
    const t = setInterval(() => {
      setSecs(Math.max(0, Math.round((Date.now() - (since || Date.now())) / 1000)))
    }, 500)
    return () => clearInterval(t)
  }, [since])
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] text-amber-700">
      <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
      Crew working… {secs}s — advocates first, judge calls it
    </div>
  )
}

function AIChatView({ sessions, setSessions, activeId, setActiveId, messages, setMessages,
                      area, roadBounds, markedRegion, selectedId, busy, setBusy }) {
  // Per-session drafts: typing in thread A never appears in thread B.
  const [drafts, setDrafts] = useState({})
  // Per-session image attachments: {sid: {file, url}}.
  const [attachments, setAttachments] = useState({})
  // Per-session in-flight flags: two chats can send in parallel.
  const [busySids, setBusySids] = useState({})
  const [renaming, setRenaming] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  // The orb's hands-free turns live here but the thread stays hidden —
  // chat tab and orb never fight over the same visible session.
  const visibleSessions = (sessions || []).filter((s) => s.title !== 'Voice console')
  const activeMessages = messages[activeId] || []
  const draft = activeId ? (drafts[activeId] ?? '') : ''
  const attachment = activeId ? attachments[activeId] : null
  const previewUrl = attachment?.url || null
  const pendingImage = attachment?.file || null
  const chatBusy = Boolean(activeId && busySids[activeId])

  function setDraft(text) {
    if (!activeId) return
    setDrafts((prev) => ({ ...prev, [activeId]: text }))
  }

  function clearDraft(sid) {
    setDrafts((prev) => {
      if (!(sid in prev)) return prev
      const next = { ...prev }
      delete next[sid]
      return next
    })
  }

  function setBusySid(sid, on) {
    setBusySids((prev) => {
      if (on) return { ...prev, [sid]: Date.now() }
      if (!(sid in prev)) return prev
      const next = { ...prev }
      delete next[sid]
      return next
    })
  }

  function revokeUrl(url) {
    if (!url) return
    try { URL.revokeObjectURL(url) } catch { /* noop */ }
  }

  // Revoke all blob URLs on unmount (audio replies + attachment previews).
  useEffect(() => {
    const atts = attachments
    return () => {
      Object.values(atts).forEach((a) => revokeUrl(a?.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshSessions(selectFirst = false) {
    try {
      const res = await api.listChatSessions()
      const list = res.sessions || []
      setSessions(list)
      if (selectFirst && !activeId && list.length > 0) setActiveId(list[0].session_id)
    } catch (err) {
      toast.error('Sessions unavailable', { description: err.message })
    }
  }

  useEffect(() => { refreshSessions(true) }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages, activeId])

  async function openSession(sid) {
    // Stop any in-progress recording: it belongs to the previous thread.
    try { recorderRef.current?.stop() } catch { /* noop */ }
    setRecording(false)
    setActiveId(sid)
    if (messages[sid]) return
    try {
      const res = await api.chatSessionHistory(sid)
      setMessages((prev) => ({
        ...prev,
        [sid]: (res.messages || []).map((m) => ({ role: m.role, content: m.content })),
      }))
    } catch (err) {
      toast.error('History unavailable', { description: err.message })
    }
  }

  async function newChat() {
    try {
      const res = await api.createChatSession({ area })
      setSessions((prev) => [res.session, ...prev])
      setActiveId(res.session.session_id)
      setMessages((prev) => ({ ...prev, [res.session.session_id]: [] }))
    } catch (err) {
      toast.error('Could not start chat', { description: err.message })
    }
  }

  async function ensureSid() {
    if (activeId) return activeId
    const res = await api.createChatSession({ area })
    const sid = res.session.session_id
    setSessions((prev) => [res.session, ...prev])
    setActiveId(sid)
    setMessages((prev) => ({ ...prev, [sid]: [] }))
    return sid
  }

  function startRecord() {
    const gum = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
    if (!window.MediaRecorder || !gum) {
      const secure = window.isSecureContext
      toast.error('Voice notes unavailable', {
        description: secure
          ? 'This browser cannot record audio (no microphone found).'
          : 'Microphone needs a secure page — open this console via http://localhost:5173 (not a LAN IP / plain HTTP).',
      })
      return
    }
    gum({ audio: true }).then((stream) => {
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data)
      }
      rec.onerror = () => toast.error('Recording failed', { description: 'Microphone stream error — retry.' })
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        if (blob.size) sendVoice(blob)
        else toast.error('Empty recording', { description: 'No audio captured — check the mic is not muted.' })
      }
      recorderRef.current = rec
      rec.start(250)
      setRecording(true)
    }).catch(() => toast.error('Microphone blocked', { description: 'Allow mic access, then retry.' }))
  }

  function stopRecord() {
    try { recorderRef.current?.stop() } catch { /* noop */ }
    setRecording(false)
  }

  async function sendVoice(blob) {
    // Replies are keyed to the session captured here, so switching threads
    // mid-flight never misplaces the answer. Other threads stay sendable.
    const sid = activeId || await ensureSid()
    if (busySids[sid]) return
    try {
      setBusySid(sid, true)
      const res = await api.assistantVoice(blob, { session_id: sid, area })
      let audioUrl = null
      if (res.audio_b64) {
        const bin = atob(res.audio_b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        audioUrl = URL.createObjectURL(
          new Blob([bytes], { type: res.audio_mime || 'audio/wav' }))
      }
      const tools = res.tools_called?.length ? ` [tools: ${res.tools_called.join(', ')}]` : ''
      setMessages((prev) => ({
        ...prev,
        [sid]: [...(prev[sid] || []),
          { role: 'user', content: '(voice note)', transcript: res.transcript },
          { role: 'agent', content: `${res.reply}${tools}`, audioUrl,
            audioError: audioUrl ? null : (res.audio_error || 'spoken reply unavailable') }],
      }))
      refreshSessions()
    } catch (err) {
      toast.error('Voice note failed', { description: err.message })
    } finally {
      setBusySid(sid, false)
    }
  }

  async function send(e) {
    e?.preventDefault?.()
    const sid = activeId
    const text = (sid ? (drafts[sid] ?? '') : '').trim()
    const image = sid ? attachments[sid]?.file : null
    if (!sid || busySids[sid] || recording) return
    if (!text && !image) return
    try {
      const area_context = {
        area, bounds: markedRegion || roadBounds,
        region_marked: Boolean(markedRegion),
        incident_id: selectedId || null,
      }
      if (image) {
        const localUrl = attachments[sid]?.url
        clearDraft(sid)
        setAttachments((prev) => {
          const next = { ...prev }
          delete next[sid]
          return next
        })
        setMessages((prev) => ({
          ...prev,
          [sid]: [...(prev[sid] || []),
                   { role: 'user', content: text || '(photo)', imageUrl: localUrl }],
        }))
        setBusySid(sid, true)
        const res = await api.assistantImage(image, { message: text, session_id: sid, area })
        const tools = res.tools_called?.length ? ` [tools: ${res.tools_called.join(', ')}]` : ''
        setMessages((prev) => ({
          ...prev,
          [sid]: [...(prev[sid] || []), { role: 'agent', content: `${res.reply}${tools}` }],
        }))
        refreshSessions()
        return
      }
      clearDraft(sid)
      setMessages((prev) => ({ ...prev, [sid]: [...(prev[sid] || []), { role: 'user', content: text }] }))
      setBusySid(sid, true)
      const res = await api.opsAssistant(text, [], area_context, sid)
      const tools = res.tools_called?.length ? ` [tools: ${res.tools_called.join(', ')}]` : ''
      setMessages((prev) => ({
        ...prev,
        [sid]: [...(prev[sid] || []), { role: 'agent', content: `${res.reply}${tools}`, stages: res.stages }],
      }))
      refreshSessions()
    } catch (err) {
      toast.error('Send failed', { description: err.message })
    } finally {
      setBusySid(sid, false)
    }
  }

  async function removeSession(sid) {
    try {
      await api.deleteChatSession(sid)
      const doomed = messages[sid] || []
      doomed.forEach((m) => revokeUrl(m.audioUrl))
      revokeUrl(attachments[sid]?.url)
      setSessions((prev) => prev.filter((s) => s.session_id !== sid))
      setMessages((prev) => {
        const next = { ...prev }
        delete next[sid]
        return next
      })
      clearDraft(sid)
      setAttachments((prev) => {
        const next = { ...prev }
        delete next[sid]
        return next
      })
      setBusySid(sid, false)
      if (activeId === sid) setActiveId(null)
    } catch (err) {
      toast.error('Delete failed', { description: err.message })
    }
  }

  async function renameSession(sid) {
    const title = renameText.trim()
    if (!title) {
      setRenaming(null)
      return
    }
    try {
      await api.renameChatSession(sid, title)
      setSessions((prev) => prev.map((s) => (s.session_id === sid ? { ...s, title } : s)))
    } catch (err) {
      toast.error('Rename failed', { description: err.message })
    } finally {
      setRenaming(null)
    }
  }

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] h-[calc(100vh-80px)] min-h-[580px]">
      {/* Session list */}
      <Card className="h-full flex flex-col bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <MessageSquare className="size-3.5 text-slate-500" /> Conversations
          </CardTitle>
          <button
            onClick={newChat}
            className="flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 font-mono text-[10px] font-bold text-white hover:bg-slate-700"
          >
            <Plus className="size-3" /> New
          </button>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {visibleSessions.length === 0 && (
            <p className="p-4 text-center font-mono text-xs text-slate-400">
              No conversations yet — start one.
            </p>
          )}
          {visibleSessions.map((s) => {
            const active = s.session_id === activeId
            const thinking = Boolean(busySids[s.session_id])
            return (
              <div
                key={s.session_id}
                className={`group rounded-lg border px-2.5 py-2 transition cursor-pointer ${
                  active ? 'border-slate-900 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => openSession(s.session_id)}
              >
                {renaming === s.session_id ? (
                  <input
                    autoFocus
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onBlur={() => renameSession(s.session_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameSession(s.session_id)
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 font-mono text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">
                      {s.title || 'Untitled'}
                      {thinking && <span className="ml-1.5 font-mono text-[10px] text-amber-600">● thinking</span>}
                    </p>
                    <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenaming(s.session_id)
                          setRenameText(s.title || '')
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Rename"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSession(s.session_id)
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Message pane */}
      <Card className="h-full flex flex-col bg-white min-w-0">
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Coordinator AI chat</p>
              <p className="mt-1 max-w-sm text-[13px] text-slate-500">
                Grounded in live world state. Sessions persist — pick one or start new.
              </p>
            </div>
            <button
              onClick={newChat}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Start conversation
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeMessages.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-500 space-y-2">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Ask about live operations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['What is happening here?', 'Which teams are free?', 'Any blocked roads?'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDraft(p)}
                        className="rounded bg-white px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100 border border-slate-200"
                      >
                        "{p}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 max-w-[95%]'
                  }`}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="attachment"
                         className="mb-1.5 max-h-40 rounded-lg border border-slate-200" />
                  )}
                  {msg.transcript && (
                    <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                      Voice: "{msg.transcript}"
                    </p>
                  )}
                  {msg.content}
                  {msg.audioUrl && (
                    <audio controls src={msg.audioUrl} className="mt-1.5 w-full max-w-[220px]" />
                  )}
                  {msg.audioError && (
                    <p className="mt-1 text-[10px] italic opacity-70">No audio: {msg.audioError}</p>
                  )}
                  {msg.stages?.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-slate-200 pt-2">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Crew report — step by step
                      </p>
                      {msg.stages.map((st, j) => (
                        <div key={j} className="flex gap-2">
                          <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                            st.role === 'judge' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {st.role === 'judge' ? '★' : '✓'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-sans text-[11px] font-bold text-slate-800">{st.label}</p>
                            <p className="font-sans text-[11px] leading-relaxed text-slate-600">{st.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {chatBusy && (
              <WorkingLine since={busySids[activeId]} />
            )}
            {previewUrl && (
              <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-2 py-1.5">
                <img src={previewUrl} alt="to send" className="h-10 rounded border border-slate-200" />
                <span className="font-mono text-[10px] text-slate-500">Attached — ask anything about it</span>
                <button onClick={() => {
                          if (!activeId) return
                          revokeUrl(attachments[activeId]?.url)
                          setAttachments((prev) => {
                            const next = { ...prev }
                            delete next[activeId]
                            return next
                          })
                        }}
                        className="ml-auto font-mono text-[10px] text-slate-400 hover:text-red-600">
                  remove
                </button>
              </div>
            )}
            <form onSubmit={send} className="flex gap-1.5 border-t border-slate-200 p-2 bg-white">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.size > 4 * 1024 * 1024) {
                    toast.error('Image too large (4 MB max)')
                    return
                  }
                  if (!activeId) return
                  setAttachments((prev) => {
                    revokeUrl(prev[activeId]?.url)
                    return { ...prev, [activeId]: { file: f, url: URL.createObjectURL(f) } }
                  })
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={chatBusy || recording}
                className="grid size-8 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Attach photo"
              >
                <ImagePlus className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={recording ? stopRecord : startRecord}
                disabled={chatBusy}
                className={`grid size-8 shrink-0 place-items-center rounded-md border transition disabled:opacity-50 ${
                  recording
                    ? 'border-red-300 bg-red-50 text-red-600 animate-pulse'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
                aria-label={recording ? 'Stop recording' : 'Record voice note'}
              >
                {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={recording ? 'Recording… tap square to send' : chatBusy ? 'Thinking in this thread — other threads stay open…' : 'Ask with live DB context...'}
                className="min-w-0 flex-1 font-mono text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={chatBusy || (!draft.trim() && !pendingImage) || recording}
                size="sm"
                className="size-8 p-0"
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
