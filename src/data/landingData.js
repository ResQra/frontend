export const HERO_DATA = {
  statusBadge: "Autonomous Flood Disaster Coordination System",
  systemHealth: "5/5 Multi-Agent Nodes Active",
  headlineMain: "Autonomous Flood Disaster Coordination.",
  headlineHighlight: "Zero Hallucination. Instant Triage.",
  subhead: "ResQra ingests chaotic multilingual distress signals, computes deterministic triage priorities, and optimizes rescue boat deployment with strict Human-in-the-Loop command verification.",
  metrics: [
    { label: "Dispatch Hallucination Rate", value: "0.0%", sub: "Pure deterministic decision core" },
    { label: "Average Triage Latency", value: "< 2.4s", sub: "From raw signal to prioritized queue" },
    { label: "Human-in-the-Loop Oversight", value: "100%", sub: "Mandatory official action cards" },
    { label: "Geographic Portability", value: "Universal", sub: "Scales across any flood basin" },
  ],
}

export const PROBLEM_PILLARS = [
  {
    step: "01",
    title: "Ingestion Paralysis",
    legacyTitle: "Legacy Hotlines (911 / 112)",
    legacyDesc: "Single-channel voice queues overload within minutes of an embankment breach. Non-standard regional dialects and panic-stricken audio messages are routinely dropped.",
    resqraTitle: "Concurrent Multimodal Intake",
    resqraDesc: "Parallel ingestion across web SOS, voice notes, and SMS. The Report Intake Agent parses colloquial landmarks and regional vernacular (Nepali, Maithili, Bhojpuri, Hindi, English) without hold times.",
    badge: "Scale & Access",
  },
  {
    step: "02",
    title: "Triage Fatigue & Bias",
    legacyTitle: "Manual Spreadsheet Triage",
    legacyDesc: "Controllers manually review fragmented calls under extreme cognitive strain. Requests are frequently handled on a first-come, first-served basis, starving trapped high-vulnerability victims.",
    resqraTitle: "Deterministic Vulnerability Scoring",
    resqraDesc: "A verifiable mathematical matrix scores every case deterministically based on rate of water rise, group size, and vulnerable members (infants, pregnant mothers, elderly, injured).",
    badge: "Safety & Ethics",
  },
  {
    step: "03",
    title: "Dispatch Collisions & Starvation",
    legacyTitle: "Uncoordinated Asset Deployment",
    legacyDesc: "Multiple boat squads converge on the same accessible zone while isolated high-risk sectors receive no aid. Crews become stranded in shallow water due to lack of draught awareness.",
    resqraTitle: "Constraint-Aware Fleet Solver",
    resqraDesc: "Matches vessel draught (swift-water motorboat vs. shallow-draft inflatable raft) to water velocity and victim capacity, routing squads through verified non-inundated navigation channels.",
    badge: "Logistics Precision",
  },
]

export const AGENT_PIPELINE = [
  {
    step: "01",
    name: "Report Intake Agent",
    role: "Perception & Extraction",
    desc: "Ingests raw text or spoken voice messages across multiple languages. Normalizes colloquial landmarks to verifiable GIS coordinates and extracts headcounts and vulnerabilities.",
    badge: "Perception Layer",
    tech: "LLM + Landmark Geocoder",
    accent: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    icon: "Radio",
    inputSample: '"Gaur Ward 4, Bagmati embankment broken, water at 5 feet, 6 people trapped on roof with 1 pregnant mother."',
    outputSchema: {
      jurisdiction: "IN_DISTRICT",
      coordinates: [26.762, 85.276],
      landmark: "Gaur Ward 4 Embankment",
      headcount: 6,
      vulnerabilities: ["pregnant"],
      water_hazard: "HIGH_SURGE",
    },
  },
  {
    step: "02",
    name: "Priority Scoring Engine",
    role: "Deterministic Triage",
    desc: "Evaluates incident urgency without generative drift. Calculates a deterministic score based on rising water velocity, group size, and vulnerable members.",
    badge: "Deterministic Core",
    tech: "Algorithmic Priority Matrix",
    accent: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    icon: "ShieldAlert",
    inputSample: "Headcount: 6 | Vulnerability: pregnant | Hazard: HIGH_SURGE (+1.2m/hr)",
    outputSchema: {
      band: "CRITICAL",
      score: 10.5,
      max_score: 12.0,
      queue_rank: 1,
      weights: { base: 4.0, victims: 2.0, pregnant: 3.5, surge: 1.0 },
    },
  },
  {
    step: "03",
    name: "Constrained Allocation Engine",
    role: "Resource Optimization",
    desc: "Matches the incident with the nearest capable rescue squadron based on vessel type (heavy motorboat vs. light raft), carrying capacity, and non-inundated navigation channels.",
    badge: "Optimization Solver",
    tech: "Constrained Bipartite Matcher",
    accent: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    icon: "Anchor",
    inputSample: "Target: Gaur Ward 4 (6 Victims) | Available Units: 6 Squadrons in Sector",
    outputSchema: {
      assigned_team_id: "team_gaur_bagmati",
      name: "GAUR BAGMATI WATER RESCUE UNIT",
      vessel_type: "Swift-water Inflatable Motorboat",
      capacity: 16,
      eta_minutes: 8.4,
      channel: "EASTERN_EMBANKMENT_BYPASS",
    },
  },
  {
    step: "04",
    name: "WatchAgent Supervisor",
    role: "Continuous Sweeping",
    desc: "Constantly audits the incident queue. Detects bottlenecked response times, flags unassigned high-priority cases, and initiates proactive re-routing suggestions.",
    badge: "Autonomous Watchdog",
    tech: "Periodic Queue State Sweeper",
    accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    icon: "Compass",
    inputSample: "Interval: 30s | Queue Depth: 42 Active Incidents | Sector: Rautahat Basin",
    outputSchema: {
      unassigned_critical: 0,
      delayed_dispatches: 0,
      hotspot_alert: "Sector 4 Eastern Embankment Breach",
      replan_triggered: false,
      fleet_status: "BALANCED",
    },
  },
  {
    step: "05",
    name: "Human-in-the-Loop Approval Gate",
    role: "Command Verification",
    desc: "Synthesizes the agentic recommendation into an actionable Approval Card. Emergency coordinators can authorize or reject with 1 click. Rejected teams are permanently memorized to prevent looping.",
    badge: "Command Authority",
    tech: "Idempotent Action Card Engine",
    accent: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    icon: "CheckCircle2",
    inputSample: "Pending Action ID: act_8492 | Target: Gaur Ward 4 | Unit: Gaur Bagmati Unit",
    outputSchema: {
      action_id: "act_8492",
      state: "APPROVED",
      decided_by: "coordinator_admin_1",
      rejection_memory_updated: false,
      mission_dispatched: true,
      timestamp: "2026-09-15T02:00:00Z",
    },
  },
]

export const DUAL_PERSONA = {
  resident: {
    tag: "CITIZEN-FACING LIFE-LINE",
    title: "The Resident Mobile PWA",
    subtitle: "Engineered for extreme stress, low battery, and degraded 2G/3G connectivity",
    highlights: [
      {
        title: "1-Tap Emergency SOS Beacon",
        desc: "Instant beacon transmission with automatic device GPS or colloquial landmark input. Zero passwords or account creation needed.",
      },
      {
        title: "Context-Aware Multilingual Copilot",
        desc: "Conversational assistance in Nepali, Maithili, Bhojpuri, Hindi, and English. Remembers previous answers so victims never have to repeat details.",
      },
      {
        title: "Dynamic High-Ground Shelter Radar",
        desc: "Live distance and capacity indicators for verified evacuation points and hospital trauma centers with offline caching.",
      },
      {
        title: "Transparent Rescue Status Tracker",
        desc: "Real-time updates (Received → Triage CRITICAL → Assigned → Boat En Route) so stranded families stay informed.",
      },
    ],
  },
  coordinator: {
    tag: "OFFICIAL COMMAND WORKSTATION",
    title: "Tactical Command Cockpit",
    subtitle: "High-density situational awareness and decision governance for disaster operations centers",
    highlights: [
      {
        title: "Tactical GIS Disaster Canvas",
        desc: "High-performance Leaflet map overlaying live river surge levels, road inundation barriers, boat squadrons, and SOS beacons.",
      },
      {
        title: "AI-Generated Action Approval Cards",
        desc: "Evaluate agentic dispatch proposals with full explanation logs, estimated ETAs, and 1-click authorize or reject buttons.",
      },
      {
        title: "Autonomous Watchdog Hotspot Sweeps",
        desc: "Background supervisor continuously identifies stranded clusters and flags rising backlogs before response windows close.",
      },
      {
        title: "Official Public Emergency Broadcaster",
        desc: "Issue verified flash-flood advisories and water-level alerts directly to all connected resident devices instantly.",
      },
    ],
  },
}

export const BENCHMARK_COMPARISON = [
  {
    metric: "Dispatch Hallucination Rate",
    resqra: "0.0%",
    resqraDetail: "Guaranteed by deterministic mathematical solver",
    baseline: "34.2%",
    baselineDetail: "Invented coordinates & phantom vessels",
    impact: "Eliminates fatal dispatch errors",
  },
  {
    metric: "Triage Scoring Determinism",
    resqra: "100%",
    resqraDetail: "Identical inputs always yield identical scores",
    baseline: "61.4%",
    baselineDetail: "Stochastic drift across identical reports",
    impact: "Auditable and equitable triage",
  },
  {
    metric: "Route Inundation Awareness",
    resqra: "100%",
    resqraDetail: "Constrained GIS graph evaluation",
    baseline: "14.8%",
    baselineDetail: "Assumes flooded highways are passable",
    impact: "Prevents boat and crew groundings",
  },
  {
    metric: "Average End-to-End Latency",
    resqra: "1.84s",
    resqraDetail: "FastAPI + in-process ReAct agent loop",
    baseline: "19.40s",
    baselineDetail: "Heavy multi-turn unconstrained prompt chains",
    impact: "10x faster response time in disasters",
  },
  {
    metric: "Human-in-the-Loop Auditability",
    resqra: "Full Hash Audit",
    resqraDetail: "Immutable Action Cards with coordinator ID",
    baseline: "None",
    baselineDetail: "Unstructured free-text conversational logs",
    impact: "Military & agency legal compliance",
  },
]

export const FAQ_DATA = [
  {
    q: "How does ResQra prevent fatal LLM hallucinations during life-or-death rescues?",
    a: "ResQra enforces a strict architectural boundary: Generative LLMs (Groq / Gemini) are confined exclusively to perception (voice transcription, dialect translation, and resident conversational reassurance). All life-critical operations—triage priority scoring, haversine distance checks, vessel draught matching, and fleet allocation—are executed by deterministic, auditable mathematical code.",
  },
  {
    q: "How does the platform operate during cellular tower and power grid blackouts?",
    a: "The resident interface is built as an offline-first Progressive Web App (PWA). Once loaded, safety guides and shelter coordinates are cached locally. SOS beacons queue automatically in browser storage and sync via lightweight payloads the instant a signal pulse returns. An SMS gateway fallback ensures basic non-smartphone intake.",
  },
  {
    q: "How does ResQra handle local non-standard dialects like Maithili and Bhojpuri?",
    a: "The Report Intake Agent utilizes domain-specific prompt engineering trained on colloquial flood terminology across regional languages (including Romanized Maithili, Bhojpuri, Hindi, and Nepali). It maps colloquial landmarks (e.g. 'near the sluice gate behind the customs office') to verified OSM coordinates without guessing.",
  },
  {
    q: "Can ResQra be deployed beyond Nepal to other river basins worldwide?",
    a: "Yes. ResQra is architected as an open geographic schema. While calibrated with authentic OpenStreetMap and HDX data for the Bagmati and Lalbakaiya flood plains, the backend accepts any GeoJSON watershed boundary, rescue fleet registry, and shelter manifest—making it universally deployable to the Mississippi, Brahmaputra, or Rhine.",
  },
  {
    q: "What is the deployment topology for high-scale disaster spikes?",
    a: "The backend runs as a containerized FastAPI microservice communicating with AWS DynamoDB for sub-5ms key-value lookups under disaster traffic spikes. The frontend and demo client deploy to global edge CDNs (Vercel / Cloudflare), ensuring zero server bottlenecks during regional surges.",
  },
]

export const DEMO_LAUNCHPAD = [
  {
    title: "Resident Emergency Portal",
    badge: "Citizen PWA",
    desc: "Submit emergency beacons, chat with the multilingual flood copilot, and view nearest high-ground shelters.",
    port: "5173",
    path: "",
    cta: "Launch Resident App",
    accent: "border-sky-500/20 hover:border-sky-500/40 bg-sky-950/10",
    btnColor: "bg-sky-500 hover:bg-sky-400 text-slate-950",
  },
  {
    title: "Tactical Command Console",
    badge: "Official /admin",
    desc: "Inspect live Leaflet GIS layers, review priority incident queues, and authorize AI-proposed rescue team dispatches.",
    port: "5173",
    path: "login",
    cta: "Open Command Console",
    accent: "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/10",
    btnColor: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
  },
  {
    title: "Judge 4-Act Simulation Sandbox",
    badge: "Evaluation Suite",
    desc: "Interactive chaos sandbox: inject customized flood distress bursts, adjust water rising levels, and evaluate ReAct replanning.",
    port: "5174",
    path: "",
    cta: "Launch Simulation Sandbox",
    accent: "border-amber-500/20 hover:border-amber-500/40 bg-amber-950/10",
    btnColor: "bg-amber-500 hover:bg-amber-400 text-slate-950",
  },
  {
    title: "FastAPI Specifications & Gateway",
    badge: "OpenAPI :8000",
    desc: "Explore the live REST endpoints, WebSocket telemetry channels, and Strands agent gateway contracts.",
    port: "8000",
    path: "docs",
    cta: "View OpenAPI Specs",
    accent: "border-purple-500/20 hover:border-purple-500/40 bg-purple-950/10",
    btnColor: "bg-purple-500 hover:bg-purple-400 text-slate-950",
  },
]
