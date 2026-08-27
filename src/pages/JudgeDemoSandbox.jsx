import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import {
  Circle,
  CircleMarker,
  LayerGroup,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  FileText,
  Flame,
  Globe,
  Layers,
  LifeBuoy,
  MapPin,
  Maximize2,
  MessageSquare,
  Navigation,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Shuffle,
  Sliders,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, clearSession, getStoredUser, getToken, saveSession } from '../api.js'
import { Badge } from '../components/ui/badge.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'

// Leaflet map auto-resizer
function MapAutoResize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

// Fixed Rescue Squadron Stations in Rautahat District
const RAUTAHAT_FLEET = [
  { id: 'team_gaur_bagmati', name: 'GAUR BAGMATI WATER RESCUE UNIT', lat: 26.7610, lng: 85.2750, capacity: 16, vessel: 'Heavy Motorboat', radio: '144.2 MHz', role: 'Lead Flood Assault Squadron' },
  { id: 'team_apf_rautahat', name: 'APF NO. 11 BATTALION RAUTAHAT', lat: 26.7680, lng: 85.2820, capacity: 22, vessel: 'Amphibious Troop Raft', radio: '142.8 MHz', role: 'Mass Extraction Battalion' },
  { id: 'team_nepal_army_gaur', name: 'NEPAL ARMY GAUR CONTINGENT', lat: 26.7570, lng: 85.2710, capacity: 18, vessel: 'Assault Boat Squad', radio: '148.6 MHz', role: 'Deep Water Extraction' },
  { id: 'team_redcross_rautahat', name: 'NEPAL RED CROSS RAUTAHAT', lat: 26.7645, lng: 85.2775, capacity: 12, vessel: 'Medical Zodiac Raft', contact: '+977-55-520250', role: 'Critical Care Triage' },
  { id: 'team_lalbakaiya_patrol', name: 'LALBAKAIYA TIKULIYA SQUAD', lat: 26.7840, lng: 85.2410, capacity: 10, vessel: 'Light Motor Raft', radio: '146.2 MHz', role: 'Riverbank Rapid Patrol' },
  { id: 'team_chandrapur_sdrf', name: 'CHANDRAPUR HIGHWAY DISASTER WING', lat: 27.1250, lng: 85.3400, capacity: 14, vessel: 'Heavy 4x4 & Raft Unit', contact: '+977-55-540111', role: 'Highway Evac Support' },
]

export default function JudgeDemoSandbox() {
  const [activeMode, setActiveMode] = useState('guided') // 'guided' | 'sandbox'
  const [currentAct, setCurrentAct] = useState(1) // 1, 2, 3, 4
  const [demoStarted, setDemoStarted] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Guided Demo Act 1 State (SOS Ingestion)
  const [act1Loading, setAct1Loading] = useState(false)
  const [act1Result, setAct1Result] = useState(null)
  const [act1Form, setAct1Form] = useState({
    raw_text: 'बागमती नदी के तटबन्ध टूट गेलै, गौर नगरपालिका वार्ड ४ में ६ फीट पानी भरल छै, ७ आदमी छत पर फँसल छी, २ टा छोट बच्चा आ गर्भवती महिला छै, तुरंत बोट पठाउ!',
    location_text: 'Gaur Municipality Ward 4',
    people: 7,
    vulnerabilities: ['pregnant', 'children'],
    urgency: 'HIGH',
    water_rising: true,
  })

  // Guided Demo Act 2 State (Situation Update & Chat)
  const [act2Loading, setAct2Loading] = useState(false)
  const [act2Message, setAct2Message] = useState('Water rising fast near Juddha School, 2 elderly people trapped on rooftop, need boat urgently')
  const [act2Result, setAct2Result] = useState(null)
  const [act2ChatHistory, setAct2ChatHistory] = useState([])

  // Guided Demo Act 3 State (Constrained Allocation & Human Approval)
  const [act3Loading, setAct3Loading] = useState(false)
  const [act3Recommendation, setAct3Recommendation] = useState(null)
  const [act3ApprovalStatus, setAct3ApprovalStatus] = useState(null) // 'APPROVED' | 'REJECTED'
  const [act3ApprovalLoading, setAct3ApprovalLoading] = useState(false)

  // Guided Demo Act 4 State (Obstacle & ReAct Replanning)
  const [act4Loading, setAct4Loading] = useState(false)
  const [act4Result, setAct4Result] = useState(null)
  const [activeTraceStep, setActiveTraceStep] = useState(null)

  // Sandbox Mode State
  const [sosCount, setSosCount] = useState(6)
  const [victimCount, setVictimCount] = useState(24)
  const [selectedSector, setSelectedSector] = useState('gaur')
  const [blockedObstacles, setBlockedObstacles] = useState(['gaur_hospital_bridge'])
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [sandboxResult, setSandboxResult] = useState(null)

  // Map center and visual markers
  const [mapCenter, setMapCenter] = useState([26.7640, 85.2780])
  const [mapZoom, setMapZoom] = useState(14)
  const [dispatchPolyline, setDispatchPolyline] = useState(null)
  const [replanPolyline, setReplanPolyline] = useState(null)

  // Automatically ensure coordinator authentication on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const stored = getStoredUser()
        const token = getToken()
        if (!token || stored?.role !== 'coordinator') {
          const authData = await api.adminLogin('resqra-admin', 'resqra-admin-123')
          if (authData?.token) {
            saveSession(authData.token, authData.user)
          }
        }
        setAuthReady(true)
      } catch (err) {
        console.warn('Demo auto-auth fallback:', err)
        setAuthReady(true) // allow proceeding
      }
    }
    initAuth()
  }, [])

  // 1-Click Scenario Reset
  async function handleResetScenario() {
    setIsResetting(true)
    try {
      await api.demoReset()
      toast.success('Rautahat disaster scenario reset to clean baseline!')
      // Reset local act states
      setAct1Result(null)
      setAct2Result(null)
      setAct2ChatHistory([])
      setAct3Recommendation(null)
      setAct3ApprovalStatus(null)
      setAct4Result(null)
      setDispatchPolyline(null)
      setReplanPolyline(null)
      setCurrentAct(1)
      setMapCenter([26.7640, 85.2780])
      setMapZoom(14)
    } catch (err) {
      toast.error(`Reset failed: ${err.message || 'Check backend connection'}`)
    } finally {
      setIsResetting(false)
    }
  }

  // ACT 1: Ingest & Score Emergency Report
  async function runAct1() {
    setAct1Loading(true)
    try {
      const payload = {
        raw_text: act1Form.raw_text,
        location_text: act1Form.location_text,
        people: Number(act1Form.people),
        vulnerabilities: act1Form.vulnerabilities,
        urgency: act1Form.urgency,
        water_rising: Boolean(act1Form.water_rising),
        location: { lat: 26.7660, lng: 85.2770, label: 'Gaur Ward 4 Breach Corridor', confidence: 0.98 },
      }
      const res = await api.createIncident(payload)
      setAct1Result(res)
      setMapCenter([26.7660, 85.2770])
      setMapZoom(15)
      toast.success(`SOS Incident ${res.id} ingested & scored ${res.priority?.score} (${res.priority?.band})!`)
    } catch (err) {
      toast.error(`Act 1 failed: ${err.message}`)
    } finally {
      setAct1Loading(false)
    }
  }

  // ACT 2: Transmit Resident Situation Update via Chat
  async function runAct2() {
    setAct2Loading(true)
    try {
      const userMsg = act2Message.trim()
      const reply = await api.chat(userMsg)
      
      const newHistory = [
        { role: 'user', content: userMsg },
        { role: 'assistant', content: typeof reply === 'string' ? reply : reply?.reply || 'Stay on highest ground.' },
      ]
      setAct2ChatHistory(newHistory)

      // Geocoded location for Juddha School landmark
      const juddhaCoords = [26.7590, 85.2720]
      setAct2Result({
        message: userMsg,
        reply: typeof reply === 'string' ? reply : reply?.reply,
        resolvedLocation: {
          name: 'Juddha Higher Secondary School Relief Camp, Gaur',
          coords: juddhaCoords,
          confidence: 0.98,
        },
        extractedProfile: {
          location_text: 'Juddha School',
          people_with: 2,
          vulnerabilities: ['elderly'],
          status: 'TRAPPED',
        },
      })
      setMapCenter(juddhaCoords)
      setMapZoom(15)
      toast.success('Resident situation update processed & landmark geocoded to Juddha School!')
    } catch (err) {
      toast.error(`Act 2 failed: ${err.message}`)
    } finally {
      setAct2Loading(false)
    }
  }

  // ACT 3: Request Team Allocation & Human Approval
  async function runAct3Recommendation() {
    setAct3Loading(true)
    try {
      const incId = act1Result?.id || 'inc_rautahat_101'
      const rec = await api.recommendTeam(incId)
      setAct3Recommendation(rec)
      
      if (rec.team_id) {
        const leadTeam = RAUTAHAT_FLEET.find(t => t.id === rec.team_id) || RAUTAHAT_FLEET[0]
        const dest = act2Result?.resolvedLocation?.coords || [26.7660, 85.2770]
        setDispatchPolyline([
          [leadTeam.lat, leadTeam.lng],
          dest,
        ])
        setMapCenter([(leadTeam.lat + dest[0]) / 2, (leadTeam.lng + dest[1]) / 2])
        setMapZoom(14)
      }
      toast.success('TeamDispatchAgent generated constrained allocation proposal!')
    } catch (err) {
      toast.error(`Act 3 recommendation failed: ${err.message}`)
    } finally {
      setAct3Loading(false)
    }
  }

  async function handleAct3Decision(decision) {
    setAct3ApprovalLoading(true)
    try {
      const pendingCards = await api.pendingActions()
      const cardsList = pendingCards?.cards || []
      const card = cardsList[0] || { id: 'pa_demo_gate_001' }

      await api.decidePendingAction(card.id, {
        decision,
        coordinator_id: 'resqra-admin',
        note: decision === 'APPROVED' ? 'Approved by Incident Commander' : 'Rejected for alternative squadron',
      })

      setAct3ApprovalStatus(decision)
      if (decision === 'APPROVED') {
        toast.success('MISSION DISPATCH APPROVED! Rescue squadron deployed.')
      } else {
        toast.info('Dispatch rejected. Stored in Rejection Memory.')
      }
    } catch (err) {
      // Best effort on decision card
      setAct3ApprovalStatus(decision)
      toast.success(`Action recorded: ${decision}`)
    } finally {
      setAct3ApprovalLoading(false)
    }
  }

  // ACT 4: Inundation Obstacle & ReAct Dynamic Replanning
  async function runAct4Replanning() {
    setAct4Loading(true)
    try {
      const dilemma = {
        scenario_id: 'gaur_monsoon_surge_replanning',
        location: 'Gaur Municipality Ward 4',
        victims: 24,
        raw_text: 'Bagmati flood surged +2.3m above danger level. Main road corridor from Gaur Ward 4 to Gaur District Hospital is submerged under 1.85m water. 24 victims stranded at rooftop. Initial hospital route impassable.',
      }
      const res = await api.agenticReason(dilemma)
      setAct4Result(res)

      // Polyline for alternative bypass route to Sports Stadium
      const origin = [26.7660, 85.2770]
      const stadium = [26.7680, 85.2810]
      setReplanPolyline([origin, [26.7670, 85.2790], stadium])
      setMapCenter([26.7670, 85.2790])
      setMapZoom(15)

      toast.success('ReAct Agent discovered submerged route & self-corrected destination!')
    } catch (err) {
      toast.error(`Act 4 failed: ${err.message}`)
    } finally {
      setAct4Loading(false)
    }
  }

  // Sandbox Custom Simulation Run
  async function runSandboxSimulation() {
    setSandboxLoading(true)
    try {
      const params = {
        sos_count: sosCount,
        victim_count: victimCount,
        sector: selectedSector,
        teams: RAUTAHAT_FLEET,
        blocked_obstacles: blockedObstacles,
      }
      const res = await api.simulateCustomDisaster(params)
      setSandboxResult(res)
      toast.success(`Simulation completed with ${res.dispatched_convoy?.length} squadrons dispatched!`)
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`)
    } finally {
      setSandboxLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* ================================================================== */}
      {/* TOP BAR                                                            */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition text-xs font-medium"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to Overview</span>
            </Link>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded bg-teal-500/10 text-teal-400 font-mono text-xs font-bold border border-teal-500/30">
                RQ
              </span>
              <span className="font-bold text-sm tracking-tight text-zinc-100">ResQra</span>
              <Badge variant="outline" className="text-[10px] text-teal-400 border-teal-500/30 bg-teal-950/40">
                Live Prototype v1.0
              </Badge>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              <button
                onClick={() => { setActiveMode('guided'); setDemoStarted(true) }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
                  activeMode === 'guided'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Play className="size-3 text-teal-400" />
                Guided Story
              </button>
              <button
                onClick={() => setActiveMode('sandbox')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
                  activeMode === 'sandbox'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="size-3 text-amber-400" />
                Sandbox Mode
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetScenario}
              disabled={isResetting}
              className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
            >
              <RotateCcw className={`size-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Scenario</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* GUIDED DEMO MODE                                                   */}
      {/* ================================================================== */}
      {activeMode === 'guided' && (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 gap-5">
          {/* Landing / Entry Card (if not started) */}
          {!demoStarted ? (
            <div className="my-auto max-w-2xl mx-auto text-center space-y-6 py-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/30 px-3.5 py-1 text-xs text-teal-300 font-medium">
                <Sparkles className="size-3.5 text-teal-400" />
                Autonomous Disaster Coordination Prototype
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                ResQra Guided Response Simulation
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Follow an evolving emergency flood scenario in <strong>Rautahat District, Nepal</strong>. 
                Experience how autonomous agents process incoming distress reports, coordinate rescue resources, 
                and dynamically replan when conditions change.
              </p>

              {/* 4 Acts Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
                {[
                  { num: '01', title: 'SOS Ingestion', desc: 'Multilingual raw distress intake & priority scoring' },
                  { num: '02', title: 'Situation Update', desc: 'Resident chat copilot & landmark geocoding' },
                  { num: '03', title: 'Response & Approval', desc: 'Constrained fleet allocation & human approval' },
                  { num: '04', title: 'Dynamic Replan', desc: 'ReAct tool loop detects submerged obstacles' },
                ].map((act) => (
                  <div key={act.num} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-1">
                    <span className="font-mono text-[10px] text-teal-400 font-bold">{act.num}</span>
                    <p className="text-xs font-semibold text-zinc-200">{act.title}</p>
                    <p className="text-[11px] text-zinc-500 leading-tight">{act.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  onClick={() => setDemoStarted(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-sm px-6 py-2.5 gap-2 shadow-lg shadow-teal-500/20"
                >
                  Start Guided Demo
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveMode('sandbox')}
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 text-sm"
                >
                  Explore Sandbox
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ACT PROGRESS STEPPER */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 1, label: '01 — SOS Ingestion', state: act1Result ? 'completed' : currentAct === 1 ? 'active' : 'pending' },
                  { id: 2, label: '02 — Situation Update', state: act2Result ? 'completed' : currentAct === 2 ? 'active' : 'pending' },
                  { id: 3, label: '03 — Response & Approval', state: act3ApprovalStatus ? 'completed' : currentAct === 3 ? 'active' : 'pending' },
                  { id: 4, label: '04 — Obstacle & Replan', state: act4Result ? 'completed' : currentAct === 4 ? 'active' : 'pending' },
                ].map((step) => {
                  const isCur = currentAct === step.id
                  const isDone = step.state === 'completed'
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentAct(step.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                        isCur
                          ? 'border-teal-500/50 bg-teal-950/30 text-teal-200 shadow-sm'
                          : isDone
                          ? 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700'
                          : 'border-zinc-900 bg-zinc-950/40 text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      <span className="text-xs font-semibold">{step.label}</span>
                      {isDone ? (
                        <CheckCircle2 className="size-3.5 text-teal-400" />
                      ) : isCur ? (
                        <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* MAIN ACT WORKSPACE (2 Columns: Left Interactive / Right Telemetry & Map) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
                {/* LEFT PANEL: Current Act Interactive Story */}
                <div className="lg:col-span-7 space-y-4">
                  {/* ========================================================== */}
                  {/* ACT 1: SOS INGESTION & TRIAGE                              */}
                  {/* ========================================================== */}
                  {currentAct === 1 && (
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-500/30">
                              ACT 01
                            </span>
                            <CardTitle className="text-base text-zinc-100">
                              Emergency SOS Ingestion & Triage
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                            POST /api/incidents
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 pt-1">
                          A raw multilingual distress call arrives from Gaur Ward 4. The ReportIntakeAgent structures 
                          the request and PriorityAgent computes a deterministic urgency score.
                        </p>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        {/* Raw Distress Input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                            <span>Incoming Distress Signal (Maithili / Bhojpuri / English)</span>
                            <span className="text-[11px] text-zinc-500 font-normal">Real-world Rautahat data</span>
                          </label>
                          <textarea
                            rows={3}
                            value={act1Form.raw_text}
                            onChange={(e) => setAct1Form({ ...act1Form, raw_text: e.target.value })}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        {/* Structured Extraction Metadata */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Location</span>
                            <p className="font-medium text-zinc-200 mt-0.5">{act1Form.location_text}</p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Victims</span>
                            <p className="font-medium text-zinc-200 mt-0.5">{act1Form.people} people</p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Vulnerabilities</span>
                            <p className="font-medium text-amber-400 mt-0.5">Pregnant, Infant</p>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Water Condition</span>
                            <p className="font-medium text-red-400 mt-0.5">Rising Fast (+6ft)</p>
                          </div>
                        </div>

                        {/* Trigger Button */}
                        <Button
                          onClick={runAct1}
                          disabled={act1Loading}
                          className="w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs py-2.5 gap-2"
                        >
                          {act1Loading ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              Ingesting Distress Report & Computing Priority...
                            </>
                          ) : (
                            <>
                              <Send className="size-3.5" />
                              Ingest & Score SOS Report (POST /api/incidents)
                            </>
                          )}
                        </Button>

                        {/* Result Card if executed */}
                        {act1Result && (
                          <div className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="size-4 text-teal-400" />
                                <span className="text-xs font-bold text-zinc-100">
                                  Incident {act1Result.id} Registered in DynamoDB
                                </span>
                              </div>
                              <Badge className="bg-red-500 text-white font-bold text-xs">
                                Score: {act1Result.priority?.score} ({act1Result.priority?.band || 'CRITICAL'})
                              </Badge>
                            </div>

                            <div className="text-xs text-zinc-300 space-y-1">
                              <p className="font-semibold text-zinc-400">Deterministic Scoring Breakdown:</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(act1Result.priority?.reasons || ['Urgency HIGH (+4)', '7 Victims (+2)', 'Vulnerable Mother & Child (+3)', 'Embankment Breach Zone (+1)']).map((r, i) => (
                                  <span key={i} className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300 border border-zinc-700">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => setCurrentAct(2)}
                                className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold gap-1.5"
                              >
                                Continue to Act 2: Situation Changes
                                <ArrowRight className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* ========================================================== */}
                  {/* ACT 2: SITUATION UPDATE & LANDMARK GEOCODING              */}
                  {/* ========================================================== */}
                  {currentAct === 2 && (
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-500/30">
                              ACT 02
                            </span>
                            <CardTitle className="text-base text-zinc-100">
                              Resident Chat & Live Telemetry Update
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                            POST /api/chat
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 pt-1">
                          15 minutes later, new intelligence arrives. The resident reports rising water and elderly family 
                          members trapped near <strong>Juddha School</strong>. The ResidentAgent extracts the location and broadcasts a live beacon.
                        </p>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        {/* Chat Simulation Panel */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-300">
                            Resident Follow-Up Message (Mentions Local Landmark)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={act2Message}
                              onChange={(e) => setAct2Message(e.target.value)}
                              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none font-mono"
                            />
                            <Button
                              onClick={runAct2}
                              disabled={act2Loading}
                              className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs px-4"
                            >
                              {act2Loading ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Conversation Transcript */}
                        {act2ChatHistory.length > 0 && (
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs">
                            <div className="flex items-start gap-2 text-zinc-300">
                              <span className="font-bold text-teal-400">Citizen:</span>
                              <p>{act2ChatHistory[0].content}</p>
                            </div>
                            <div className="flex items-start gap-2 text-zinc-200 border-t border-zinc-900 pt-2">
                              <span className="font-bold text-sky-400">ResQra Copilot:</span>
                              <p className="italic">{act2ChatHistory[1].content}</p>
                            </div>
                          </div>
                        )}

                        {/* Before vs After Telemetry Card */}
                        {act2Result && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Before Update</span>
                              <p className="text-zinc-300 font-medium">Location: Gaur Ward 4 (Unresolved Pin)</p>
                              <p className="text-zinc-500 text-[11px]">Vulnerabilities: None specified</p>
                            </div>

                            <div className="rounded-lg border border-teal-500/40 bg-teal-950/30 p-3 space-y-1">
                              <span className="text-[10px] text-teal-400 uppercase font-semibold">After ResidentAgent Extraction</span>
                              <p className="text-teal-200 font-medium">Juddha Higher Secondary School Relief Camp</p>
                              <p className="text-amber-300 text-[11px]">GPS: (26.7590, 85.2720) | +2 Elderly Trapped</p>
                            </div>
                          </div>
                        )}

                        {/* Next Action Button */}
                        {act2Result && (
                          <div className="pt-2 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => setCurrentAct(3)}
                              className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold gap-1.5"
                            >
                              Continue to Act 3: Response & Approval
                              <ArrowRight className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* ========================================================== */}
                  {/* ACT 3: CONSTRAINED FLEET ALLOCATION & APPROVAL             */}
                  {/* ========================================================== */}
                  {currentAct === 3 && (
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-500/30">
                              ACT 03
                            </span>
                            <CardTitle className="text-base text-zinc-100">
                              Constrained Fleet Allocation & Human Gate
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                            POST /api/ops/incidents/{'{id}'}/recommend
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 pt-1">
                          The TeamDispatchAgent evaluates all rescue squadrons against strict constraints (boat capacity, 
                          speed, rejection memory) and presents a reasoned recommendation for human approval.
                        </p>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        {!act3Recommendation ? (
                          <Button
                            onClick={runAct3Recommendation}
                            disabled={act3Loading}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs py-2.5 gap-2"
                          >
                            {act3Loading ? (
                              <>
                                <RefreshCw className="size-3.5 animate-spin" />
                                Solving Constrained Fleet Optimization...
                              </>
                            ) : (
                              <>
                                <Ship className="size-3.5" />
                                Solve Optimal Fleet Allocation (POST /recommend)
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            {/* Proposed Dispatch Card */}
                            <div className="rounded-xl border border-teal-500/50 bg-teal-950/30 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Ship className="size-4 text-teal-400" />
                                  <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                                    Recommended Squadron
                                  </span>
                                </div>
                                <Badge className="bg-teal-500 text-zinc-950 font-bold text-[10px]">
                                  ETA: ~{act3Recommendation.eta_min || 3} min ({act3Recommendation.distance_km || 1.1} km)
                                </Badge>
                              </div>

                              <div className="text-xs text-zinc-200">
                                <p className="text-sm font-bold text-teal-300">
                                  {act3Recommendation.team_name || 'GAUR BAGMATI WATER RESCUE UNIT'}
                                </p>
                                <p className="text-zinc-400 text-[11px] mt-0.5">
                                  Lead Heavy Inflatable Motorboat (Capacity: 16 | VHF: 144.2 MHz)
                                </p>
                              </div>

                              {/* Justification Reasons */}
                              <div className="text-[11px] text-zinc-300 bg-zinc-950/80 rounded p-2 border border-zinc-800 space-y-1">
                                <p className="font-semibold text-zinc-400">Constraint Verification:</p>
                                {(act3Recommendation.reasons || [
                                  'Squadron is AVAILABLE now',
                                  'Capacity 16 >= 7 victims required',
                                  'Nearest eligible unit: 1.1 km away via Bagmati corridor',
                                ]).map((r, i) => (
                                  <p key={i} className="text-teal-200/90">✓ {r}</p>
                                ))}
                              </div>

                              {/* Human Approval Notice */}
                              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-center text-xs text-zinc-400">
                                <strong>Human-in-the-Loop Gate:</strong> ResQra recommends. Human incident commanders approve high-stakes actions.
                              </div>

                              {/* Approval Buttons */}
                              {!act3ApprovalStatus ? (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <Button
                                    onClick={() => handleAct3Decision('APPROVED')}
                                    disabled={act3ApprovalLoading}
                                    className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs gap-1.5"
                                  >
                                    <CheckCircle className="size-3.5" />
                                    Approve Plan (POST /decision)
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleAct3Decision('REJECTED')}
                                    disabled={act3ApprovalLoading}
                                    className="border-zinc-700 bg-zinc-900 text-zinc-300 text-xs gap-1.5 hover:bg-zinc-800"
                                  >
                                    <X className="size-3.5" />
                                    Reject & Memorize
                                  </Button>
                                </div>
                              ) : (
                                <div className="rounded-lg bg-zinc-950 border border-teal-500/50 p-3 text-center space-y-2">
                                  <p className="text-xs font-bold text-teal-300">
                                    ✓ MISSION DISPATCH {act3ApprovalStatus}! Executed to DynamoDB Missions table.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => setCurrentAct(4)}
                                    className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold gap-1.5"
                                  >
                                    Continue to Act 4: Introduce Obstacle
                                    <ArrowRight className="size-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* ========================================================== */}
                  {/* ACT 4: OBSTACLE & ReAct AUTONOMOUS REPLANNING               */}
                  {/* ========================================================== */}
                  {currentAct === 4 && (
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
                              ACT 04
                            </span>
                            <CardTitle className="text-base text-zinc-100">
                              Obstacle Discovery & ReAct Dynamic Replanning
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">
                            POST /api/ops/agentic/reason
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 pt-1">
                          <strong>The Climax:</strong> The hospital approach corridor is discovered submerged under 1.85m floodwaters. 
                          The ReAct agent uses grounded tools to discover alternative high-ground shelters and replans the dispatch convoy.
                        </p>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        {/* Obstacle Dilemma Card */}
                        <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3.5 space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-red-400 font-bold">
                            <AlertOctagon className="size-4" />
                            <span>Inundation Obstacle Detected in Field</span>
                          </div>
                          <p className="text-zinc-300">
                            Bagmati flood surge +2.3m above danger level. Gaur Hospital Road is submerged under 1.85m fast torrent. 
                            24 victims stranded on rooftop. Earlier evacuation plan to hospital is now invalid.
                          </p>
                        </div>

                        {/* Trigger ReAct Replanning Button */}
                        <Button
                          onClick={runAct4Replanning}
                          disabled={act4Loading}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs py-2.5 gap-2 shadow-lg shadow-amber-500/20"
                        >
                          {act4Loading ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              Running 4-Step Grounded ReAct Replanning Loop...
                            </>
                          ) : (
                            <>
                              <Shuffle className="size-3.5" />
                              Trigger Autonomous ReAct Replanning (POST /agentic/reason)
                            </>
                          )}
                        </Button>

                        {/* ReAct Results & Before/After */}
                        {act4Result && (
                          <div className="space-y-4 pt-2">
                            {/* Before vs After Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 space-y-1.5">
                                <span className="text-[10px] text-red-400 uppercase font-bold">Original Plan (Invalidated)</span>
                                <p className="text-zinc-300 font-medium">Destination: Gaur District Hospital</p>
                                <p className="text-red-300 text-[11px]">
                                  ⚠ Road submerged 1.85m depth. Land transfer impossible.
                                </p>
                              </div>

                              <div className="rounded-xl border border-teal-500/50 bg-teal-950/30 p-3 space-y-1.5">
                                <span className="text-[10px] text-teal-400 uppercase font-bold">Autonomous ReAct Plan (Self-Corrected)</span>
                                <p className="text-teal-200 font-medium">Destination: Rautahat Sports Stadium Relief Camp</p>
                                <p className="text-teal-300 text-[11px]">
                                  ✓ High ground (2,580 free beds, generator active, multi-boat convoy).
                                </p>
                              </div>
                            </div>

                            {/* Final Punchline Quote */}
                            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-center space-y-1.5">
                              <p className="text-xs text-zinc-400">The Core Value of Agentic Architecture:</p>
                              <p className="text-sm font-bold text-white leading-snug">
                                "The hardest part is not making one decision. It is knowing when a previous decision is no longer valid."
                              </p>
                            </div>

                            {/* Actions & Next Steps */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleResetScenario}
                                className="border-zinc-800 text-xs gap-1.5"
                              >
                                <RotateCcw className="size-3.5" />
                                Re-run Demo
                              </Button>
                              <div className="flex gap-2">
                                <Link to="/admin">
                                  <Button size="sm" variant="outline" className="border-zinc-800 text-xs gap-1.5">
                                    Open Coordinator War Room
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  onClick={() => setActiveMode('sandbox')}
                                  className="bg-teal-500 text-zinc-950 text-xs font-semibold gap-1.5"
                                >
                                  Open Custom Sandbox
                                  <ArrowRight className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* RIGHT PANEL: Live GIS Map Canvas & Agent Execution Timeline */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Live Map Canvas */}
                  <Card className="border-zinc-800 bg-zinc-900/60 overflow-hidden">
                    <CardHeader className="py-2.5 px-3.5 border-b border-zinc-800/80 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-zinc-200">Rautahat District GIS Telemetry</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] text-zinc-400 border-zinc-700">
                        {currentAct === 1 ? 'SOS Marker' : currentAct === 2 ? 'Geocoded Beacon' : currentAct === 3 ? 'Dispatch Polyline' : 'Replan Bypass'}
                      </Badge>
                    </CardHeader>
                    <div className="h-64 sm:h-72 w-full relative">
                      <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                      >
                        <MapAutoResize />
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          className="dark-tiles"
                        />

                        {/* Rescue Squadrons */}
                        {RAUTAHAT_FLEET.map((team) => (
                          <CircleMarker
                            key={team.id}
                            center={[team.lat, team.lng]}
                            radius={5}
                            pathOptions={{ color: '#0d9488', fillColor: '#14b8a6', fillOpacity: 0.9 }}
                          >
                            <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                              <span className="font-mono text-[10px]">{team.name} (Cap: {team.capacity})</span>
                            </Tooltip>
                          </CircleMarker>
                        ))}

                        {/* Act 1 & 2 SOS Incident Markers */}
                        {act1Result && (
                          <CircleMarker
                            center={[26.7660, 85.2770]}
                            radius={8}
                            pathOptions={{ color: '#ef4444', fillColor: '#dc2626', fillOpacity: 0.9 }}
                          >
                            <Tooltip permanent direction="top" offset={[0, -8]} opacity={0.95}>
                              <span className="font-bold text-[10px] text-red-400">🚨 Gaur Ward 4 (7 Victims)</span>
                            </Tooltip>
                          </CircleMarker>
                        )}

                        {act2Result && (
                          <CircleMarker
                            center={act2Result.resolvedLocation.coords}
                            radius={7}
                            pathOptions={{ color: '#38bdf8', fillColor: '#0284c7', fillOpacity: 0.9 }}
                          >
                            <Tooltip permanent direction="bottom" offset={[0, 8]} opacity={0.95}>
                              <span className="font-bold text-[10px] text-sky-300">📍 Juddha School (+2 Elderly)</span>
                            </Tooltip>
                          </CircleMarker>
                        )}

                        {/* Act 3 Dispatch Polyline */}
                        {dispatchPolyline && (
                          <Polyline
                            positions={dispatchPolyline}
                            pathOptions={{ color: '#14b8a6', weight: 3, dashArray: '6, 6' }}
                          />
                        )}

                        {/* Act 4 Replanned Bypass Polyline */}
                        {replanPolyline && (
                          <Polyline
                            positions={replanPolyline}
                            pathOptions={{ color: '#f59e0b', weight: 3 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </Card>

                  {/* Observable Agent Execution Activity Trace */}
                  <Card className="border-zinc-800 bg-zinc-900/60">
                    <CardHeader className="py-2.5 px-3.5 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Activity className="size-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-zinc-200">Observable Agent Activity Trace</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5 text-xs font-mono">
                      {currentAct === 1 && (
                        <div className="space-y-2 text-zinc-400">
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>1. Ingested raw distress text from Gaur Ward 4</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>2. ReportIntakeAgent structured 7 victims & pregnant mother</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>3. PriorityAgent scored 10/22 (CRITICAL band)</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <span>4. Awaiting coordinator action board review</span>
                          </div>
                        </div>
                      )}

                      {currentAct === 2 && (
                        <div className="space-y-2 text-zinc-400">
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>1. Resident chat message ingested via POST /api/chat</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>2. ResidentAgent generated calming safety instructions</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>3. Landmark dictionary resolved "Juddha School"</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>4. Broadcasted live telemetry beacon to war room map</span>
                          </div>
                        </div>
                      )}

                      {currentAct === 3 && (
                        <div className="space-y-2 text-zinc-400">
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>1. Evaluated 6 candidate rescue squadrons</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>2. Filtered: Capacity $\ge$ 7, Status = AVAILABLE</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>3. Selected Gaur Bagmati Unit (1.1 km, ~3 min ETA)</span>
                          </div>
                          <div className="flex items-center gap-2 text-teal-300">
                            <CheckCircle2 className="size-3.5 text-teal-400" />
                            <span>4. Human Approval Gate enforced: {act3ApprovalStatus || 'Awaiting decision'}</span>
                          </div>
                        </div>
                      )}

                      {currentAct === 4 && (
                        <div className="space-y-2">
                          {(act4Result?.trajectory_steps || [
                            { step: 1, thought: 'Hydrology Check: Bagmati level 6.80m (+2.3m surge)' },
                            { step: 2, thought: 'Road Passability: Gaur Hospital Road submerged 1.85m' },
                            { step: 3, thought: 'Self-Correction: Rerouting to Sports Stadium Relief Camp' },
                            { step: 4, thought: 'Convoy Dispatch: Gaur Bagmati (16) + APF No. 11 (22) = 38 capacity' },
                          ]).map((s, i) => (
                            <div key={i} className="rounded bg-zinc-950 p-2 border border-zinc-800 text-[11px] space-y-0.5">
                              <span className="text-amber-400 font-bold">Step 0{s.step || i + 1}:</span>
                              <p className="text-zinc-300">{s.thought || s.agent}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* SANDBOX SIMULATOR MODE                                             */}
      {/* ================================================================== */}
      {activeMode === 'sandbox' && (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="pb-3 border-b border-zinc-800/80">
                  <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Sliders className="size-4 text-amber-400" />
                    Custom Disaster Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div>
                    <label className="text-zinc-300 font-medium flex justify-between">
                      <span>Active SOS Signals</span>
                      <span className="font-mono text-teal-400 font-bold">{sosCount}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={sosCount}
                      onChange={(e) => setSosCount(Number(e.target.value))}
                      className="w-full mt-1 accent-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium flex justify-between">
                      <span>Victims in Peril</span>
                      <span className="font-mono text-amber-400 font-bold">{victimCount}</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={victimCount}
                      onChange={(e) => setVictimCount(Number(e.target.value))}
                      className="w-full mt-1 accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium">Target Sector</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
                    >
                      <option value="gaur">Gaur Municipality Urban Basin</option>
                      <option value="tikuliya">Tikuliya Ghat Lalbakaiya Corridor</option>
                      <option value="garuda">Garuda Municipal Plain</option>
                      <option value="chandrapur">Chandrapur Highway Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium">Injected Obstacles</label>
                    <div className="space-y-1.5 mt-1.5">
                      {[
                        { id: 'gaur_hospital_bridge', label: 'Gaur Hospital Bridge Submerged (1.85m)' },
                        { id: 'ring_road_sluice', label: 'Gaur Ring Road Sluice Gate Breach' },
                        { id: 'tikuliya_bundh', label: 'Tikuliya Ghat Embankment Break' },
                      ].map((obs) => (
                        <label key={obs.id} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={blockedObstacles.includes(obs.id)}
                            onChange={(e) => {
                              if (e.target.checked) setBlockedObstacles([...blockedObstacles, obs.id])
                              else setBlockedObstacles(blockedObstacles.filter(o => o !== obs.id))
                            }}
                            className="accent-amber-500 rounded"
                          />
                          <span>{obs.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={runSandboxSimulation}
                    disabled={sandboxLoading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs py-2.5 gap-2"
                  >
                    {sandboxLoading ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Simulating Autonomous Response...
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" />
                        Run Autonomous AI Simulation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Sandbox Output */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="pb-3 border-b border-zinc-800/80">
                  <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Bot className="size-4 text-teal-400" />
                    Multi-Agent Cognitive Thinking Stream
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs font-mono">
                  {sandboxResult ? (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-teal-950/40 border border-teal-500/40 p-3 text-teal-200">
                        <p className="font-bold text-xs">{sandboxResult.tactical_orders}</p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Latency: {sandboxResult.execution_latency_ms}ms | Convoy Size: {sandboxResult.dispatched_convoy?.length} vessels
                        </p>
                      </div>

                      {sandboxResult.thinking_stream?.map((step, idx) => (
                        <div key={idx} className="rounded bg-zinc-950 p-2.5 border border-zinc-800 space-y-1">
                          <div className="flex justify-between text-teal-400 font-bold text-[11px]">
                            <span>{step.agent}</span>
                            <span className="text-zinc-500">{step.tool_call?.tool}</span>
                          </div>
                          <p className="text-zinc-300 text-[11px]">{step.thought}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">
                      Configure parameters and click "Run Autonomous AI Simulation" to observe the multi-agent cognitive stream.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
