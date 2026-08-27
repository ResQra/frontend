import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Flame,
  FlaskConical,
  Layers,
  ListChecks,
  Megaphone,
  Plus,
  Radio,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
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
import IncidentTimeline from '../../components/IncidentTimeline.jsx'
import useWebSocket from '../../hooks/useWebSocket.js'
import AgentObservabilityView from './AgentObservabilityView.jsx'
import GlobalDisasterMonitorView from './GlobalDisasterMonitorView.jsx'
import ResQraBenchView from './ResQraBenchView.jsx'
import DemoSandboxModal from '../../components/DemoSandboxModal.jsx'
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { CommandMenu } from '../../components/CommandMenu.jsx'
import { KpiDashboard } from '../../components/KpiDashboard.jsx'
import { DataTable } from '../../components/data-table/DataTable.jsx'
import { ColumnHeader } from '../../components/data-table/ColumnHeader.jsx'
import { Button } from '../../components/ui/button.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'

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

function scoreBadge(score = 0) {
  if (score >= 8) {
    return 'bg-white text-black font-black shadow-md ring-1 ring-white'
  }
  if (score >= 5) {
    return 'bg-zinc-300 text-black font-bold'
  }
  return 'bg-zinc-800 text-zinc-300 font-medium border border-zinc-700'
}

function statusPill(status) {
  const tones = {
    AVAILABLE: 'bg-zinc-900 text-zinc-200 border-zinc-700',
    ON_MISSION: 'bg-white text-black font-bold border-white',
    RETURNING: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    OFFLINE: 'bg-black text-zinc-600 border-zinc-800',
    NEW: 'bg-zinc-900 text-zinc-100 border-zinc-600',
    VERIFIED: 'bg-zinc-900 text-zinc-200 border-zinc-700',
    PRIORITIZED: 'bg-zinc-800 text-white font-bold border-zinc-500',
    ASSIGNED: 'bg-zinc-800 text-zinc-100 border-zinc-400',
    IN_PROGRESS: 'bg-zinc-700 text-white font-bold border-zinc-400',
    RESCUED: 'bg-zinc-900 text-zinc-300 border-zinc-700',
    RESOLVED: 'bg-black text-zinc-500 border-zinc-800',
  }
  return tones[status] || 'bg-zinc-900 text-zinc-300 border-zinc-800'
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
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantHistory, setAssistantHistory] = useState([])
  const [commandOpen, setCommandOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [report, setReport] = useState({ title: '', body: '', severity: 'INFO', area_text: '', source: 'Emergency Coordination Center' })
  const [layers, setLayers] = useState({
    heatmap: true, roads: true, incidents: true, teams: true,
    shelters: true, residents: true, sensors: true, areas: true,
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
    return [[27.62, 85.22], [27.78, 85.42]]
  }, [areaConfig])

  async function load() {
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
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [area, roadBounds])

  // Live WebSocket Push
  const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = typeof window !== 'undefined'
    ? ((import.meta.env.VITE_API_BASE_URL || '').replace(/^https?:\/\//, '') || window.location.host)
    : 'localhost:8000'
  const wsUrl = `${wsProtocol}//${wsHost}/ws/ops`
  const { connected: wsConnected, lastEvent: wsEvent } = useWebSocket(wsUrl)

  useEffect(() => {
    if (wsEvent) {
      load()
      toast.info('Live Intel Update', {
        description: wsEvent.summary || 'Real-time telemetry event received via WebSocket.',
      })
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
      areas: visibleIncidents.length > 0 ? mapData.areas || [] : [],
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
      (t) => (t.district || 'kathmandu').toLowerCase() === teamDistrictFilter.toLowerCase()
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

  async function withBusy(label, fn) {
    setBusy(label)
    try {
      await fn()
      await load()
    } catch (err) {
      toast.error('Action Failed', { description: err.message })
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
    try {
      const res = await api.opsAssistant(message, nextHistory)
      setAssistantHistory([...nextHistory, { role: 'agent', content: res.reply }])
    } catch (err) {
      setAssistantHistory([...nextHistory, { role: 'agent', content: err.message }])
    } finally {
      setBusy('')
    }
  }

  // TanStack Table columns for Rescue Fleet
  const teamColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <ColumnHeader column={column} title="Callsign / Asset" />,
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-white text-xs">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">{row.original.specialization || 'Water Rescue'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'district',
        header: ({ column }) => <ColumnHeader column={column} title="Madhesh Corridor" />,
        cell: ({ row }) => {
          const d = (row.original.district || 'madhesh').toUpperCase()
          return (
            <Badge variant="outline" className="font-mono text-[10px] uppercase border-zinc-700 text-zinc-300">
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
        cell: ({ row }) => <span className="font-mono text-xs font-bold text-white">{row.original.capacity} seats</span>,
      },
      {
        accessorKey: 'rescued_total',
        header: ({ column }) => <ColumnHeader column={column} title="Rescued" />,
        cell: ({ row }) => <span className="font-mono text-xs text-zinc-300">{row.original.rescued_total ?? 0}</span>,
      },
      {
        accessorKey: 'contact',
        header: ({ column }) => <ColumnHeader column={column} title="Comms" />,
        cell: ({ row }) => <span className="font-mono text-xs text-zinc-400">{row.original.contact || 'Radio'}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Override</span>,
        cell: ({ row }) => (
          <select
            value={row.original.status}
            onChange={(e) => withBusy(`team-${row.original.id}`, () => api.setTeamStatus(row.original.id, e.target.value))}
            className="rounded border border-zinc-800 bg-black px-2 py-1 font-mono text-[11px] text-zinc-200"
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
      onOpenDemo={() => setDemoOpen(true)}
      onRefresh={load}
      busy={busy}
      user={user}
      onSignOut={signOut}
      wsConnected={wsConnected}
    >
      {/* Interactive Judge Demo & Simulation Modal */}
      <DemoSandboxModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onOpenCockpit={(sector) => {
          setArea(sector || 'rautahat')
          setView('dispatch')
          load()
        }}
      />

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
      {/* VIEW 0: GLOBAL DISASTER SITUATION ROOM (WORLD MONITOR EXPERIENCE)         */}
      {/* ========================================================================= */}
      {view === 'global_monitor' && (
        <GlobalDisasterMonitorView
          onFocusTactical={(event) => {
            setView('dispatch')
            toast.info('Local Tactical Focus Active', {
              description: `Focused tactical response on ${event.title}`,
            })
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW 0.5: RESQRA-BENCH (AUTONOMOUS AGENT EVALUATION SUITE)                */}
      {/* ========================================================================= */}
      {view === 'benchmark' && <ResQraBenchView />}

      {/* ========================================================================= */}
      {/* VIEW 1: TACTICAL MAP COCKPIT (CLEAN 3-COLUMN NON-OVERLAPPING WORKSPACE)   */}
      {/* ========================================================================= */}
      {view === 'dispatch' && (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[330px_minmax(420px,1fr)_380px] h-[calc(100vh-80px)] min-h-[580px]">
          
          {/* COLUMN 1: LIVE SOS TRIAGE QUEUE */}
          <Card className="h-full flex flex-col bg-[#09090b]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-black">
              <CardTitle className="flex items-center gap-2 text-xs">
                <AlertTriangle className="size-3.5 text-zinc-400" /> SOS Triage Queue
              </CardTitle>
              <span className="font-mono text-[10px] text-zinc-500">{filteredBoard.length} items</span>
            </CardHeader>

            {/* Search & Filter Bar */}
            <div className="p-2 border-b border-zinc-800 bg-black space-y-1.5">
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#09090b] px-2.5 py-1 text-xs text-zinc-300">
                <Search className="size-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter incidents (⌘K)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none w-full font-mono"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
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
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setQueueFilter(key)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      queueFilter === key
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Incidents List */}
            <div className="divide-y divide-zinc-800/60 overflow-y-auto flex-1">
              {filteredBoard.length === 0 && (
                <div className="p-6 text-center font-mono text-xs text-zinc-500">
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
                    className={`block w-full p-2.5 text-left transition ${
                      active
                        ? 'bg-zinc-900 border-l-2 border-white'
                        : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`grid size-7 shrink-0 place-items-center rounded font-mono text-xs ${scoreBadge(score)}`}>
                        {score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-bold text-white truncate">{item.id}</span>
                          <Badge className={statusPill(item.status)}>{item.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-300">
                          {item.raw_text}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono text-[9px]">
                          <span className="rounded bg-zinc-900 px-1 py-0.5 text-zinc-400 border border-zinc-800">
                            👥 {item.people ?? 1}
                          </span>
                          {hasPending && (
                            <span className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 font-bold text-black">
                              ⚡ GATE READY
                            </span>
                          )}
                          {item.water_rising && (
                            <span className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200 border border-zinc-700">
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
          <div className="relative rounded-xl border border-zinc-800 overflow-hidden shadow-2xl h-full">
            <MapView
              {...mapLayers}
              height="100%"
              darkTiles={true}
              onIncidentSelect={(incident) => setSelectedId(incident.id)}
              areaCenter={areaConfig?.center || [27.7000, 85.3200]}
              areaBounds={roadBounds}
              visibleLayers={layers}
              onLayerToggle={toggleLayer}
            />
          </div>

          {/* COLUMN 3: INSPECTOR & ACTION COCKPIT */}
          <Card className="h-full flex flex-col bg-[#09090b]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-black">
              <CardTitle className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-3.5 text-zinc-400" /> Decision Cockpit
              </CardTitle>
              <div className="flex gap-1 font-mono text-[10px]">
                {['decision', 'agent_trace', 'timeline', 'copilot'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setInspectorTab(t)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      inspectorTab === t ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-white'
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
                  selected={selected}
                  recommendedTeam={recommendedTeam}
                  teams={teams}
                  busy={busy}
                  onStatus={(status) => withBusy('status', () => api.setIncidentStatus(selected.id, status))}
                  onAssign={(teamId) => withBusy('assign', () => api.assignTeam(selected.id, teamId))}
                  onRecommend={() => withBusy('recommend', () => api.recommendTeam(selected.id))}
                  onDecide={(pendingId, decision) =>
                    withBusy('decide', async () => {
                      await api.decidePendingAction(pendingId, { decision })
                      toast.success(`Action ${decision}`, { description: `Pending dispatch ${pendingId} finalized.` })
                    })
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
                    <div className="text-center font-mono text-xs text-zinc-500 py-8">Select an incident to view audit stream</div>
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
                />
              )}
            </div>
          </Card>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MULTI-AGENT OBSERVABILITY & CONTROL MATRIX                        */}
      {/* ========================================================================= */}
      {view === 'agents' && (
        <AgentObservabilityView />
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
              <h2 className="font-mono text-base font-bold text-white">Rescue Fleet Roster & Readiness</h2>
              <p className="text-xs text-zinc-400">Sortable live directory of registered rescue boats and disaster battalions</p>
            </div>

            {/* Corridor District Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-500 uppercase font-bold text-[10px] mr-1">Rautahat Fleet:</span>
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
            </div>
          </div>
          <DataTable columns={teamColumns} data={filteredTeams} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: RESIDENT SIGNALS & DISTRESS TELEMETRY                             */}
      {/* ========================================================================= */}
      {view === 'people' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(520px,1fr)_420px]">
          <div className="h-[620px] rounded-xl border border-zinc-800 overflow-hidden">
            <MapView
              {...mapLayers}
              height="100%"
              darkTiles={true}
              onIncidentSelect={(incident) => setSelectedId(incident.id)}
              areaCenter={areaConfig?.center || [27.7000, 85.3200]}
              areaBounds={roadBounds}
              visibleLayers={layers}
              onLayerToggle={toggleLayer}
            />
          </div>
          <Card className="bg-[#09090b]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <ListChecks className="size-3.5 text-zinc-400" /> Citizen Distress Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[540px] overflow-y-auto space-y-2.5 pt-0">
              {mapData.residents?.length === 0 && <p className="font-mono text-xs text-zinc-500 p-4">No active resident signals.</p>}
              {mapData.residents?.map((person) => (
                <div key={person.id} className="rounded-xl border border-zinc-800 bg-black p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white text-xs">{person.name || person.phone || person.id}</p>
                      <p className="font-mono text-[11px] text-zinc-400">{person.location_text || person.location?.label || 'GPS Telemetry'}</p>
                    </div>
                    <Badge variant="secondary">
                      {person.plot_source === 'stated_geocoded' ? 'stated' : 'gps'}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="rounded bg-zinc-950 px-2 py-1 border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase">People:</span>
                      <p className="font-bold text-zinc-200">{person.people_with ?? 'Unknown'}</p>
                    </div>
                    <div className="rounded bg-zinc-950 px-2 py-1 border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase">Status:</span>
                      <p className="font-bold text-zinc-200">{person.status || 'UNKNOWN'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: BULLETINS & OFFICIAL ADVISORIES                                  */}
      {/* ========================================================================= */}
      {view === 'advisories' && (
        <div className="grid gap-4 lg:grid-cols-[400px_minmax(480px,1fr)]">
          <Card className="bg-[#09090b]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs">
                <Megaphone className="size-3.5 text-zinc-400" /> Transmit Emergency Bulletin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={publishReport} className="space-y-3">
                <input required placeholder="Bulletin headline" value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-white" />
                <select value={report.severity} onChange={(e) => setReport({ ...report, severity: e.target.value })} className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-white">
                  <option>INFO</option>
                  <option>WARNING</option>
                  <option>CRITICAL</option>
                </select>
                <textarea required rows={5} placeholder="Full emergency instructions for citizens..." value={report.body} onChange={(e) => setReport({ ...report, body: e.target.value })} className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-white" />
                <input placeholder="Affected regions / wards" value={report.area_text} onChange={(e) => setReport({ ...report, area_text: e.target.value })} className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-white" />
                <Button className="w-full font-mono text-xs font-bold" disabled={busy === 'report'}>
                  Transmit Bulletin
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-[#09090b]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs">
                <Activity className="size-3.5 text-zinc-400" /> Active Transmissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-white text-sm">{item.title}</p>
                    <Badge className={statusPill('PRIORITIZED')}>{item.severity}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">{item.body}</p>
                  {item.area_text && <p className="mt-2 font-mono text-[11px] text-zinc-500">Target: {item.area_text}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

    </AdminLayout>
  )
}

// ---------------------------------------------------------------------------
// DECISION COCKPIT (1-CLICK GATE & OVERRIDES)
// ---------------------------------------------------------------------------
function DecisionCockpit({ selected, recommendedTeam, teams, busy, onStatus, onAssign, onRecommend, onDecide }) {
  const [manualTeamId, setManualTeamId] = useState('')
  const actionDisabled = Boolean(busy)
  const pendingCard = (selected?.pending_actions || []).find((c) => c.state === 'PENDING')

  if (!selected) {
    return <div className="p-6 text-center font-mono text-xs text-zinc-500">Select an incident from queue.</div>
  }

  return (
    <div className="p-3 space-y-3">
      {/* Selected Incident Header */}
      <div className="border-b border-zinc-800 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-white">{selected.id}</span>
          <Badge className={statusPill(selected.status)}>{selected.status}</Badge>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">
          {selected.raw_text}
        </p>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-zinc-400">
          <span>📍 {selected.location_text || selected.location?.label || 'GPS Location'}</span>
          <span>👥 {selected.people ?? 1} people</span>
        </div>
      </div>

      {/* 1-CLICK APPROVAL GATE CARD */}
      {pendingCard ? (
        <div className="rounded-xl border border-white bg-zinc-950 p-3 shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              Supervisor Approval Gate
            </span>
            <span className="font-mono text-[9px] text-zinc-500">{pendingCard.id}</span>
          </div>

          <div className="rounded bg-black p-2 border border-zinc-800">
            <p className="text-xs font-bold text-white">
              Proposed Asset: <span className="text-zinc-200">{selected.recommendation?.team_name || pendingCard.proposed_team_id}</span>
            </p>
            <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-zinc-400">
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
        <div className="rounded-xl border border-zinc-800 bg-black p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase text-zinc-500">Agent Recommendation</span>
            <button
              disabled={actionDisabled}
              onClick={onRecommend}
              className="font-mono text-[10px] font-bold text-white hover:underline"
            >
              Re-evaluate
            </button>
          </div>
          <p className="text-xs font-bold text-white">
            {selected.recommendation?.team_name || 'No eligible asset currently'}
            {selected.recommendation?.eta_min != null && <span className="font-normal text-zinc-400"> (ETA ~{selected.recommendation.eta_min}m)</span>}
          </p>
          <ul className="space-y-0.5 font-mono text-[10px] text-zinc-400">
            {selected.recommendation?.reasons?.slice(0, 3).map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>
      )}

      {/* Priority Breakdown Matrix */}
      <div className="rounded-xl border border-zinc-800 bg-black p-2.5 font-mono text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-500">F03 Priority Factor Math</span>
          <span className="font-bold text-white">{selected.priority?.score ?? 0}/10</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400">
          <div>Urgency: <b className="text-zinc-200">{selected.urgency || 'MEDIUM'}</b></div>
          <div>Water Rising: <b className="text-zinc-200">{selected.water_rising ? 'YES' : 'NO'}</b></div>
          <div>Vulnerabilities: <b className="text-zinc-200">{selected.vulnerabilities?.length || 0}</b></div>
          <div>Location: <b className="text-zinc-200">{selected.location ? 'GEOCODED' : 'UNRESOLVED'}</b></div>
        </div>
      </div>

      {/* Commander Manual Overrides */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-800">
        <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">Manual Override</span>
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={selected.status}
            onChange={(e) => onStatus(e.target.value)}
            className="rounded border border-zinc-800 bg-black px-2 py-1 font-mono text-xs text-zinc-200"
          >
            {STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-1">
            <select
              value={manualTeamId}
              onChange={(e) => setManualTeamId(e.target.value)}
              className="rounded border border-zinc-800 bg-black px-2 py-1 font-mono text-xs text-zinc-200 flex-1 min-w-0"
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
  if (!selected) return <div className="p-4 font-mono text-xs text-zinc-500">No incident selected</div>

  return (
    <div className="p-3 space-y-3 font-mono text-xs">
      <div className="rounded-lg border border-zinc-800 bg-black p-3 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
            <Cpu className="size-3.5" /> 1. IntakeAgent NLP Extraction
          </span>
          <span className="text-[10px]">Confidence: 96%</span>
        </div>
        <div className="rounded bg-zinc-950 p-2 text-[11px] text-zinc-300 space-y-0.5">
          <p>• People extracted: <b>{selected.people ?? 1}</b></p>
          <p>• Urgency tag: <b>{selected.urgency || 'MEDIUM'}</b></p>
          <p>• Vulnerabilities: <b>{selected.vulnerabilities?.join(', ') || 'None stated'}</b></p>
          <p>• Water rising flag: <b>{selected.water_rising ? 'TRUE' : 'FALSE'}</b></p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black p-3 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
            <Zap className="size-3.5" /> 2. Priority Engine (Deterministic Math)
          </span>
          <span className="text-[10px]">Formula: F03</span>
        </div>
        <div className="rounded bg-zinc-950 p-2 text-[11px] text-zinc-300 space-y-0.5">
          <p>• Final Score: <b>{selected.priority?.score ?? 0}/10</b></p>
          <p>• Scoring Factors:</p>
          <ul className="pl-3 space-y-0.5 text-zinc-400">
            {selected.priority?.reasons?.map((r, i) => <li key={i}>- {r}</li>) || <li>- Base calculated</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black p-3 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5">
            <Ship className="size-3.5" /> 3. Allocation Engine & RejectionMemory
          </span>
        </div>
        <div className="rounded bg-zinc-950 p-2 text-[11px] text-zinc-300 space-y-0.5">
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
function CopilotTab({ assistantHistory, assistantInput, setAssistantInput, sendAssistant, busy }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {assistantHistory.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-black p-3 text-xs text-zinc-400 space-y-2 font-mono">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Ops Intelligence Assistant
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Direct conversational query with live database snapshot.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                'Summarize critical bottlenecks',
                'Which boats are available now?',
                'Draft evacuation advisory',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setAssistantInput(prompt)}
                  className="rounded bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
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
                ? 'ml-auto max-w-[85%] bg-white text-black font-medium'
                : 'bg-black text-zinc-200 border border-zinc-800 max-w-[95%]'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendAssistant} className="flex gap-1.5 border-t border-zinc-800 p-2 bg-black">
        <input
          value={assistantInput}
          onChange={(e) => setAssistantInput(e.target.value)}
          placeholder="Ask copilot with live DB context..."
          className="min-w-0 flex-1 font-mono text-xs rounded-lg border border-zinc-800 bg-black px-3 py-1.5 text-white placeholder:text-zinc-600 focus:outline-none"
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
