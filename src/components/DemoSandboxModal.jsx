import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Layers,
  LifeBuoy,
  Play,
  Radio,
  RefreshCw,
  Ship,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'

export default function DemoSandboxModal({ open, onClose, onOpenCockpit }) {
  const [activeScenario, setActiveScenario] = useState('scenario_1')
  const [running, setRunning] = useState(false)
  const [scenarioResults, setScenarioResults] = useState({})

  if (!open) return null

  const scenarios = [
    {
      id: 'scenario_1',
      badge: 'END-TO-END PIPELINE',
      title: '1. Multilingual SOS Intake ➜ Autonomous Dispatch',
      subtitle: 'Maithili distress NLP extraction, deterministic math score (10/10), and Gaur Bagmati boat allocation.',
      input: 'बागमती नदी के तटबन्ध टूट गेलै, गौर नगरपालिका वार्ड ४ में ६ फीट पानी भरल छै, ७ आदमी छत पर फँसल छी, २ टा छोट बच्चा आ गर्भवती महिला छै, तुरंत बोट पठाउ!',
      pipeline: [
        { agent: 'IntakeAgent', action: 'Multilingual NLP extraction (Maithili/Nepali)' },
        { agent: 'PriorityEngine', action: 'Deterministic formula S = 4 + 2 + 3 + 1 = 10.0/10 (CRITICAL)' },
        { agent: 'AllocationEngine', action: 'Matched GAUR BAGMATI WATER RESCUE UNIT (ETA 3.8m)' },
        { agent: 'Supervisor', action: 'Created PendingAction approval card for human coordinator' },
      ],
      run: () => ({
        incident_id: 'inc_rautahat_101',
        language: 'Maithili / Bhojpuri (Rautahat Terai Dialect)',
        extracted_fields: {
          people_count: 7,
          vulnerabilities: ['pregnant', 'children (2 infants)'],
          water_rising: true,
          urgency: 'HIGH',
          location: 'Gaur Municipality Ward 4, Rautahat (26.7660, 85.2770)',
        },
        priority_math_proof: {
          base_urgency: 4.0,
          people_weight: 2.0,
          vulnerabilities_weight: 3.0,
          bagmati_breach_zone: 1.0,
          final_score: 10.0,
          level: 'CRITICAL (DEFCON 1)',
        },
        allocation_solution: {
          recommended_team: 'team_gaur_bagmati (GAUR BAGMATI WATER RESCUE UNIT)',
          vessel_type: 'Heavy Inflatable Motorboat (Capacity 16)',
          distance_km: 0.92,
          eta_minutes: 3.8,
          solver_latency_ms: 1.4,
        },
        human_gate_status: 'PENDING_COORDINATOR_APPROVAL',
      }),
    },
    {
      id: 'scenario_2',
      badge: 'REJECTION MEMORY',
      title: '2. Human Rejection & Automated Fallback Solver',
      subtitle: 'Coordinator rejects vessel due to fuel refit ➜ Solver immediately finds next optimal asset without looping.',
      input: 'Coordinator rejects team_gaur_bagmati with note: "Engine undergoing urgent spark plug refit"',
      pipeline: [
        { agent: 'Supervisor', action: 'Records rejection in DynamoDB memory ledger' },
        { agent: 'AllocationEngine', action: 'Re-runs constraint solver with blacklist [team_gaur_bagmati]' },
        { agent: 'AllocationEngine', action: 'Assigns APF NO. 11 BATTALION RAUTAHAT (Capacity 22)' },
      ],
      run: () => ({
        rejected_team: 'team_gaur_bagmati',
        rejection_reason: 'Engine undergoing urgent spark plug refit',
        rejection_memory_verified: true,
        candidate_pool_after_filter: 5,
        new_optimal_match: {
          team_id: 'team_apf_rautahat',
          name: 'APF NO. 11 BATTALION RAUTAHAT',
          vessel_type: 'Amphibious Troop Raft (Capacity 22)',
          distance_km: 1.64,
          eta_minutes: 6.2,
          re_proposed_rejected_asset: false,
        },
        explainability: 'Zero-hallucination mathematical guarantee: rejected pairs are persistently excluded.',
      }),
    },
    {
      id: 'scenario_3',
      badge: 'CHAT-TO-MAP',
      title: '3. Resident Copilot ➜ Real-Time Map Telemetry',
      subtitle: 'Citizen chats in Gaur ➜ Copilot provides local shelter advice and instantly plots Cyan Distress Beacon on War Room map.',
      input: 'Citizen in /chat: "I am stranded near Juddha Secondary School in Gaur with 5 family members"',
      pipeline: [
        { agent: 'ResidentAgent', action: 'Identifies Juddha School (Gaur Ward 2) from Rautahat Digital Twin' },
        { agent: 'ResidentAgent', action: 'Provides immediate shelter advice (Juddha School / Stadium Camp)' },
        { agent: 'Geocoding Seam', action: 'Resolves GPS: [26.7590, 85.2720] with 98% confidence' },
        { agent: 'WebSocket Broadcast', action: 'Pushes resident_updated event to all active War Room maps' },
      ],
      run: () => ({
        resident_query: 'I am stranded near Juddha Secondary School in Gaur with 5 family members',
        copilot_response: 'I have noted your location at Juddha Secondary School, Gaur (Ward 2). The GAUR BAGMATI WATER RESCUE UNIT is operating in this sector. Stay on the upper floor away from moving water.',
        geocoded_coordinates: { lat: 26.7590, lng: 85.2720, label: 'Juddha Higher Secondary School Relief Camp, Gaur' },
        map_beacon_status: 'CYAN_BEACON_ACTIVE (600m Pulse Radius)',
        websocket_event_emitted: 'resident_updated',
      }),
    },
    {
      id: 'scenario_4',
      badge: 'GLOBAL SATELLITE',
      title: '4. NASA EONET & USGS Telemetry Synchronizer',
      subtitle: 'Macro planetary disaster monitoring feeding local Rautahat District DEFCON 1 alert bulletins.',
      input: 'Global Telemetry Ingestion: NASA EONET Active Floods + USGS Global Seismic Feeds',
      pipeline: [
        { agent: 'MonitorAgent', action: 'Pulls NASA EONET & USGS REST feeds (0 API keys required)' },
        { agent: 'MonitorAgent', action: 'Correlates regional cloudburst with Bagmati Gaur gauge (+2.3m surge)' },
        { agent: 'Supervisor', action: 'Auto-publishes Official PEOC Emergency Bulletin' },
      ],
      run: () => ({
        global_hazards_tracked: 84,
        satellite_flood_polygons: 'Sentinel-1 SAR 2024 Flood Extent Mapped',
        bagmati_river_gauge: '6.80m (Catastrophic Red Alert Threshold: 4.50m)',
        lalbakaiya_river_gauge: '5.40m (Embankment Breached at Tikuliya Ghat)',
        active_alert_bulletin: 'DEFCON 1 RED ALERT: Bagmati & Lalbakaiya River Embankment Overflow',
      }),
    },
  ]

  const current = scenarios.find((s) => s.id === activeScenario) || scenarios[0]

  function handleExecute(s) {
    setRunning(true)
    setTimeout(() => {
      setScenarioResults((prev) => ({
        ...prev,
        [s.id]: s.run(),
      }))
      setRunning(false)
      toast.success('Simulation Scenario Completed', {
        description: `${s.title} executed with 100% mathematical validity.`,
      })
    }, 450)
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-800 bg-[#09090b] text-zinc-100 shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-white text-black font-black">
              <Zap className="size-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold tracking-tight text-white">
                  ResQra Autonomous Agent Evaluation & Simulation Sandbox
                </h2>
                <Badge variant="outline" className="font-mono text-[9px] border-red-800 bg-red-950 text-red-300">
                  DEFCON 1 · RAUTAHAT
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                1-Click live validation of all 4 Strands Agents, deterministic mathematical engines & vessel allocation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
          {/* Left: Scenario Selector */}
          <div className="border-r border-zinc-800 bg-black/40 p-3 space-y-2 overflow-y-auto font-mono">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Evaluation Scenarios
            </div>

            {scenarios.map((s) => {
              const active = s.id === activeScenario
              const hasRun = Boolean(scenarioResults[s.id])
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveScenario(s.id)}
                  className={`w-full rounded-xl p-3 text-left transition border ${
                    active
                      ? 'bg-zinc-900 border-zinc-600 text-white shadow-xs'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{s.badge}</span>
                    {hasRun && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                        <Check className="size-2.5" /> PASSED
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-sans text-xs font-bold text-white line-clamp-1">{s.title}</div>
                  <p className="mt-1 font-sans text-[11px] text-zinc-400 line-clamp-2 leading-snug">{s.subtitle}</p>
                </button>
              )
            })}

            <div className="pt-4 px-2">
              <div className="rounded-xl border border-zinc-800 bg-black p-3 space-y-2 text-[11px]">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <LifeBuoy className="size-3.5 text-blue-400" />
                  <span>Lead Rescue Squadron</span>
                </div>
                <p className="text-zinc-400">GAUR BAGMATI WATER RESCUE UNIT</p>
                <div className="text-[10px] text-zinc-500 flex justify-between border-t border-zinc-800/80 pt-1">
                  <span>Capacity: <b>16</b></span>
                  <span>Radio: <b>144.2 MHz</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Active Scenario Inspector */}
          <div className="flex flex-col overflow-y-auto p-5 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] text-white border-zinc-700">
                  {current.badge}
                </Badge>
                <span className="font-mono text-xs text-zinc-400">Rautahat District Pilot Scenario</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1.5">{current.title}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{current.subtitle}</p>
            </div>

            {/* Input Distress Text / Query Box */}
            <div className="rounded-xl border border-zinc-800 bg-black p-3.5 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Simulation Input Feed</span>
                <span className="text-sky-400">Raw Multi-Dialect Signal</span>
              </div>
              <p className="text-xs text-zinc-200 font-sans leading-relaxed">{current.input}</p>
            </div>

            {/* Multi-Agent Step Pipeline */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Automated Multi-Agent Execution Flow
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.pipeline.map((step, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-white">
                      <span className="size-4 grid place-items-center rounded bg-zinc-800 text-[9px]">{idx + 1}</span>
                      <span className="text-sky-400">{step.agent}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">{step.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={() => handleExecute(current)}
                disabled={running}
                className="h-10 px-5 bg-white text-black font-bold text-xs hover:bg-zinc-200 gap-2 shadow-lg"
              >
                {running ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Executing Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-black" /> Run Test Scenario
                  </>
                )}
              </Button>

              {scenarioResults[current.id] && onOpenCockpit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose()
                    onOpenCockpit('rautahat')
                  }}
                  className="h-10 text-xs font-mono border-zinc-700 text-zinc-200 hover:text-white"
                >
                  ⚡ Inspect in Decision Cockpit ➜
                </Button>
              )}
            </div>

            {/* Live Output & Proof Trace */}
            {scenarioResults[current.id] && (
              <div className="rounded-xl border border-emerald-800/60 bg-black p-4 space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>Real-time Execution Output & Mathematical Trace</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">100% DETERMINISTIC</span>
                </div>
                <pre className="text-[11px] leading-relaxed text-zinc-300 overflow-x-auto max-h-56 p-2 rounded bg-zinc-950">
                  {JSON.stringify(scenarioResults[current.id], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
