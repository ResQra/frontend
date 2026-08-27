import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  CircleDot,
  Eye,
  Layers,
  LifeBuoy,
  Menu,
  MessageSquareText,
  RefreshCw,
  Route,
  Search,
  Settings2,
  Shield,
  Shuffle,
  Users,
  X,
  Zap,
} from 'lucide-react'

/* ============================================================================
   ResQra Landing Page — Version 1
   Design: Calm, trustworthy, human-centered.
   No cyberpunk. No neon. No fake claims.
   ============================================================================ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLoopStep, setActiveLoopStep] = useState(0)

  // Auto-advance the coordination loop visualization
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const interval = setInterval(() => {
      setActiveLoopStep((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const navLinks = [
    { href: '#challenge', label: 'The Challenge' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#agents', label: 'Agents' },
    { href: '#architecture', label: 'Architecture' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-800 font-sans selection:bg-teal-200 selection:text-teal-900">
      {/* ================================================================== */}
      {/* SECTION 1 — NAVIGATION                                             */}
      {/* ================================================================== */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-[13px] font-bold text-white tracking-tight">
              RQ
            </span>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">
              ResQra
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13.5px] font-medium text-slate-500 transition hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              to="/demo"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Explore Demo
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 md:hidden transition hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800"
              >
                Explore Demo
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ================================================================== */}
      {/* SECTION 2 — HERO                                                    */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/60">
        <div className="mx-auto flex max-w-6xl flex-col lg:flex-row items-center gap-12 px-5 sm:px-8 py-16 sm:py-24 lg:py-28">
          {/* Left: Text */}
          <div className="flex-1 max-w-xl lg:max-w-none space-y-6 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-[12px] font-medium text-slate-500 shadow-sm">
              <span className="size-1.5 rounded-full bg-teal-500" />
              Agentic disaster-response coordination prototype
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.15] tracking-tight text-slate-900">
              When the situation changes,{' '}
              <span className="text-teal-700">the response must adapt.</span>
            </h1>

            <p className="text-[15.5px] sm:text-base leading-relaxed text-slate-500 max-w-lg mx-auto lg:mx-0">
              During disasters, emergency information changes continuously. Routes flood. 
              Teams redeploy. Priorities shift. ResQra explores how AI agents can help 
              coordinators maintain an updated operational picture and replan dynamically 
              as conditions evolve.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
              >
                Explore the Demo
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#challenge"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-medium text-slate-600 transition hover:text-slate-900 hover:bg-slate-100"
              >
                See how it works
                <ArrowDown className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Abstract operational visualization */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <HeroVisualization />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3 — REAL-WORLD CONTEXT                                      */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60 bg-white" id="challenge">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-teal-700">
              Why this matters
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              The disaster doesn't wait for the next update.
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-500">
              Floods create a constantly changing operational environment. What was true 
              an hour ago may no longer be true now. Coordination depends on information 
              that is always incomplete and always evolving.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: MessageSquareText,
                title: 'New reports arrive continuously',
                desc: 'Families report changing locations. Multiple calls describe the same event differently. Each message may alter the operational picture.',
              },
              {
                icon: Route,
                title: 'Routes become inaccessible',
                desc: 'A road passable this morning may be submerged by afternoon. Bridges rated safe can become impassable as water levels rise.',
              },
              {
                icon: Users,
                title: 'Team availability changes',
                desc: 'Rescue squadrons complete assignments, become unavailable, or are redirected. The pool of available responders shifts constantly.',
              },
              {
                icon: AlertTriangle,
                title: 'Severity escalates',
                desc: 'A low-priority situation can become critical as river gauges surge. Embankment breaches can change the entire threat landscape.',
              },
              {
                icon: Search,
                title: 'Information is incomplete',
                desc: 'Distress calls arrive in multiple dialects with partial location details. Coordinators must make decisions with imperfect data.',
              },
              {
                icon: RefreshCw,
                title: 'Earlier plans become invalid',
                desc: 'A dispatch that made sense 30 minutes ago may now route a team through a submerged corridor. Plans require continuous reassessment.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-150 bg-[#FAFAF9] p-5 space-y-2.5"
              >
                <div className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <item.icon className="size-[18px]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-semibold text-slate-800">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 4 — THE COORDINATION PROBLEM                                */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-slate-400">
              The coordination challenge
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              One coordinator. Dozens of changing signals.
            </h2>
          </div>

          {/* Visual: converging signals */}
          <div className="mt-14 mx-auto max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { text: '"Family of 7 stranded near ward 4..."', color: 'border-l-amber-500' },
                { text: '"Water level rising at Bagmati gauge..."', color: 'border-l-red-400' },
                { text: '"Hospital road submerged, 1.8m depth..."', color: 'border-l-red-500' },
                { text: '"Team 3 assignment complete, available..."', color: 'border-l-teal-500' },
                { text: '"New report: pregnant woman, rooftop..."', color: 'border-l-amber-500' },
                { text: '"Previous shelter now at capacity..."', color: 'border-l-orange-400' },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg border border-slate-200 ${msg.color} border-l-[3px] bg-white px-4 py-3 text-[13px] text-slate-600 italic leading-snug`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Converge arrow */}
            <div className="flex justify-center py-6">
              <div className="flex flex-col items-center gap-1 text-slate-300">
                <ArrowDown className="size-5" />
                <ArrowDown className="size-5 -mt-2.5" />
              </div>
            </div>

            {/* Coordinator box */}
            <div className="rounded-xl border-2 border-slate-300 bg-white p-6 text-center space-y-3">
              <div className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-600">
                <Users className="size-5" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700">
                Emergency Coordinator
              </p>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-md mx-auto">
                Must maintain an accurate operational picture, decide priorities, 
                assign resources, and track assignments — all while conditions 
                continuously change.
              </p>
            </div>

            {/* Key insight */}
            <div className="mt-10 rounded-xl bg-slate-900 p-6 sm:p-8 text-center">
              <p className="text-[15px] sm:text-base font-medium leading-relaxed text-slate-300">
                The hardest part is not making one decision.
              </p>
              <p className="mt-2 text-[17px] sm:text-lg font-bold text-white leading-snug">
                It is knowing when a previous decision is no longer valid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 5 — THE RESQRA APPROACH (Coordination Loop)                 */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60 bg-white" id="how-it-works">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-teal-700">
              The ResQra approach
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              A continuous coordination loop, not a one-time calculation.
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-500">
              ResQra maintains a persistent operational picture that updates as new 
              information arrives. Agents observe changes, assess whether existing plans 
              remain valid, and support the coordinator in deciding when to replan.
            </p>
          </div>

          {/* Loop visualization */}
          <div className="mt-14">
            <CoordinationLoop activeStep={activeLoopStep} />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 6 — WHAT MAKES IT AGENTIC?                                  */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-slate-400">
              Why agentic?
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Not a static algorithm. An adaptive system.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Left: Static workflow */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-slate-300" />
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-wide">
                  Traditional static workflow
                </h3>
              </div>
              <div className="flex flex-col items-center gap-3 py-4">
                {['Input received', 'Fixed calculation', 'Output produced'].map((step, i) => (
                  <div key={i} className="w-full">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[13px] font-medium text-slate-500">
                      {step}
                    </div>
                    {i < 2 && (
                      <div className="flex justify-center py-1.5 text-slate-300">
                        <ArrowDown className="size-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Processes data once. Cannot detect when its output becomes invalid due 
                to changing conditions.
              </p>
            </div>

            {/* Right: ResQra adaptive */}
            <div className="rounded-xl border-2 border-teal-200 bg-teal-50/40 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-teal-500" />
                <h3 className="text-[14px] font-bold text-teal-800 uppercase tracking-wide">
                  ResQra's adaptive loop
                </h3>
              </div>
              <div className="flex flex-col items-center gap-3 py-4">
                {[
                  { label: 'Observe changes', icon: Eye },
                  { label: 'Assess validity', icon: Search },
                  { label: 'Act & update', icon: Zap },
                  { label: 'Verify & adapt', icon: RefreshCw },
                ].map((step, i) => (
                  <div key={i} className="w-full">
                    <div className="flex items-center gap-2.5 rounded-lg border border-teal-200 bg-white px-4 py-3">
                      <step.icon className="size-4 text-teal-600 shrink-0" strokeWidth={2} />
                      <span className="text-[13px] font-medium text-teal-800">{step.label}</span>
                    </div>
                    {i < 3 && (
                      <div className="flex justify-center py-1.5 text-teal-300">
                        <ArrowDown className="size-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-teal-700/80 leading-relaxed">
                Continuously processes new information. Detects when earlier plans are 
                invalid and supports replanning.
              </p>
            </div>
          </div>

          {/* Key capabilities */}
          <div className="mt-12 mx-auto max-w-3xl">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-slate-400 mb-5 text-center">
              What makes it agentic
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Receives and processes changing information',
                'Maintains persistent operational context',
                'Uses tools to inspect the current situation',
                'Detects when earlier plans may be invalid',
                'Triggers re-prioritization or replanning',
                'Updates the operational state accordingly',
              ].map((cap, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-150 bg-white px-4 py-3"
                >
                  <CheckCircle className="size-4 mt-0.5 shrink-0 text-teal-600" strokeWidth={2} />
                  <span className="text-[13px] text-slate-600 leading-snug">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 7 — THE AGENT SYSTEM                                        */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60 bg-white" id="agents">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-teal-700">
              Agent system
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              How the agents work together.
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-500">
              Each component has a specific responsibility. Information flows from 
              incoming reports through structured processing to operational decisions 
              that coordinators review.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Intake Agent */}
            <AgentCard
              title="Intake Agent"
              subtitle="Information Processing"
              icon={MessageSquareText}
              receives="Raw distress messages in Nepali, Maithili, Bhojpuri, Hindi, or English"
              responsibility="Extracts structured information: people count, vulnerabilities, location, and water conditions"
              does="Normalizes multilingual input into consistent structured data. Falls back to regex extraction when LLM is unavailable."
              outputs="Structured incident profiles for prioritization"
            />

            {/* ReAct Commander */}
            <AgentCard
              title="ReAct Reasoning Engine"
              subtitle="Situational Assessment"
              icon={Settings2}
              receives="Structured incident data and current operational state"
              responsibility="Inspects the situation using tools, discovers obstacles, and assesses whether current plans remain valid"
              does="Checks river gauges, road passability, shelter capacity, and fleet availability. Self-corrects when blocked routes or capacity limits are detected."
              outputs="Assessed plans with tool-verified ground truth"
            />

            {/* Priority + Allocation */}
            <AgentCard
              title="Priority & Allocation Engines"
              subtitle="Deterministic Decision Support"
              icon={Shield}
              receives="Assessed incident data and fleet status"
              responsibility="Calculates priority scores using a mathematical formula and matches available rescue teams using constrained optimization"
              does="Computes urgency scores. Solves multi-vessel assignments using Haversine distance. Enforces vessel capacity limits and maintains a rejection memory ledger."
              outputs="Ranked dispatch recommendations for coordinator review"
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-[#FAFAF9] p-5 text-center">
            <p className="text-[13px] text-slate-500 leading-relaxed max-w-xl mx-auto">
              <strong className="text-slate-700">Human-in-the-loop:</strong> All dispatch 
              recommendations are presented to the coordinator for approval or rejection. 
              The system does not execute autonomous real-world actions.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 8 — WHEN THE SITUATION CHANGES                              */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-slate-400">
              Dynamic replanning
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              When conditions change, the plan is reassessed.
            </h2>
          </div>

          <div className="mt-14 mx-auto max-w-2xl">
            <ScenarioTimeline />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 9 — HIGH-LEVEL SYSTEM FLOW                                  */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-teal-700">
              System overview
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              How information flows through ResQra.
            </h2>
          </div>

          <div className="mt-14 mx-auto max-w-3xl">
            <SystemFlowDiagram />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 10 — TECHNICAL ARCHITECTURE                                 */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60" id="architecture">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-slate-400">
              Technical architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Built with.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { category: 'Frontend', tech: 'React 19', detail: 'Vite, Tailwind CSS, Leaflet' },
              { category: 'Backend', tech: 'FastAPI', detail: 'Python 3.11+, Uvicorn ASGI' },
              { category: 'LLM Provider', tech: 'Groq', detail: 'Llama 3.3 70B Versatile' },
              { category: 'Database', tech: 'DynamoDB', detail: 'NoSQL document store' },
              { category: 'Real-time', tech: 'WebSockets', detail: 'Live operational updates' },
              { category: 'Mapping', tech: 'Leaflet + OSM', detail: 'GIS visualization layer' },
              { category: 'External Data', tech: 'NASA EONET', detail: 'USGS seismic feeds' },
              { category: 'GIS Data', tech: 'UN OCHA HDX', detail: 'Nepal admin boundaries' },
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {t.category}
                </p>
                <p className="text-[14px] font-bold text-slate-800">{t.tech}</p>
                <p className="text-[12px] text-slate-400 leading-snug">{t.detail}</p>
              </div>
            ))}
          </div>

          {/* Key architectural decisions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="text-[13px] font-bold text-slate-700">Deterministic where it matters</h4>
              <p className="text-[12.5px] text-slate-500 leading-relaxed">
                Priority scoring and fleet allocation use mathematical formulas — not LLM 
                generation. Life-safety calculations produce predictable, reproducible results.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="text-[13px] font-bold text-slate-700">LLM where it helps</h4>
              <p className="text-[12.5px] text-slate-500 leading-relaxed">
                Natural language processing, multilingual understanding, and situational 
                reasoning use LLM capabilities — with regex fallbacks for resilience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 11 — PROJECT STATUS                                         */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-widest text-teal-700">
              Version 1
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Current project status.
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-500">
              ResQra is an active prototype. Here is an honest overview of what exists today.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Implemented */}
            <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-teal-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-teal-800">
                  Currently implemented
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Multilingual NLP intake (5 languages)',
                  'Deterministic priority scoring engine',
                  'Constrained fleet allocation solver',
                  'ReAct tool-calling reasoning engine',
                  'Rautahat District GIS Digital Twin',
                  'Coordinator tactical war room UI',
                  'Real-time WebSocket event broadcast',
                  'Citizen chat with landmark geocoding',
                  'Human-in-the-loop approval gate',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600 leading-snug">
                    <CheckCircle className="size-3.5 mt-0.5 shrink-0 text-teal-500" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* In Development */}
            <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-amber-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-amber-800">
                  In development
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Interactive judge evaluation sandbox',
                  'Standardized benchmark suite (ResQra-Bench)',
                  'Global disaster situation room',
                  'Agent observability dashboard',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600 leading-snug">
                    <CircleDot className="size-3.5 mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next */}
            <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-slate-400" />
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">
                  Planned
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Satellite SAR flood detection pipeline',
                  'SMS gateway integration',
                  'Offline-first PWA service worker',
                  'Multi-district scaling',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-500 leading-snug">
                    <CircleDot className="size-3.5 mt-0.5 shrink-0 text-slate-300" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 12 — FINAL CTA                                              */}
      {/* ================================================================== */}
      <section className="border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28 text-center">
          <div className="mx-auto max-w-lg space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              See how ResQra responds when the situation changes.
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed">
              Explore the interactive prototype. Adjust disaster parameters. 
              Observe how the agent system reassesses and replans.
            </p>
            <div className="pt-2">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2.5 rounded-lg bg-slate-900 px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
              >
                Explore the Interactive Demo
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <p className="text-[12.5px] text-slate-400 pt-1">
              Version 1 — actively under development.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 13 — FOOTER                                                 */}
      {/* ================================================================== */}
      <footer className="bg-white border-t border-slate-200/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-slate-900 text-[11px] font-bold text-white tracking-tight">
              RQ
            </span>
            <div>
              <span className="text-[14px] font-bold text-slate-800">ResQra</span>
              <p className="text-[11px] text-slate-400">
                Agentic Disaster-Response Coordination Prototype
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/admin"
              className="text-[12.5px] font-medium text-slate-400 transition hover:text-slate-600"
            >
              Coordinator Login
            </Link>
            <Link
              to="/login"
              className="text-[12.5px] font-medium text-slate-400 transition hover:text-slate-600"
            >
              Resident Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ============================================================================
   SUB-COMPONENTS
   ============================================================================ */

/* Hero visualization — abstract operational situation */
function HeroVisualization() {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-teal-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Operational Picture
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300">Live</span>
        </div>

        {/* Map-like area with abstract elements */}
        <div className="relative h-44 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
          {/* Water body */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-sky-100/60 to-transparent" />
          
          {/* Route lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180">
            {/* Active route */}
            <path
              d="M 60 140 Q 120 90 200 80 Q 280 70 340 50"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              strokeDasharray="6,4"
              opacity="0.6"
            />
            {/* Blocked route */}
            <path
              d="M 60 140 Q 100 120 160 130 Q 200 140 240 120"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,6"
              opacity="0.4"
            />
          </svg>

          {/* Incident markers */}
          <div className="absolute top-5 right-16 size-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
          <div className="absolute top-12 right-28 size-3.5 rounded-full bg-red-400 border-2 border-white shadow-sm" />
          <div className="absolute bottom-10 left-20 size-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />

          {/* Team markers */}
          <div className="absolute bottom-8 right-12 flex items-center gap-1">
            <div className="size-3 rounded-sm bg-teal-500 border border-white shadow-sm" />
          </div>
          <div className="absolute top-8 left-14 flex items-center gap-1">
            <div className="size-3 rounded-sm bg-teal-500 border border-white shadow-sm" />
          </div>

          {/* Blocked indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-1">
            <X className="size-2.5 text-red-500" />
            <span className="text-[9px] font-semibold text-red-600">Route blocked</span>
          </div>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Active incidents</p>
            <p className="text-[15px] font-bold text-slate-700 mt-0.5">6</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Teams deployed</p>
            <p className="text-[15px] font-bold text-slate-700 mt-0.5">3</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-center">
            <p className="text-[10px] text-amber-600 font-medium">Plans to reassess</p>
            <p className="text-[15px] font-bold text-amber-700 mt-0.5">2</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Coordination loop — 6 step continuous cycle */
function CoordinationLoop({ activeStep }) {
  const steps = [
    {
      key: 'observe',
      label: 'Observe',
      icon: Eye,
      desc: 'New reports and changing information arrive in the system.',
    },
    {
      key: 'understand',
      label: 'Understand',
      icon: Layers,
      desc: 'Agents identify what changed and structure the relevant information.',
    },
    {
      key: 'assess',
      label: 'Assess',
      icon: Search,
      desc: 'The system evaluates whether the change affects current priorities or plans.',
    },
    {
      key: 'decide',
      label: 'Decide',
      icon: Users,
      desc: 'The coordinator determines whether to monitor, escalate, re-prioritize, or replan.',
    },
    {
      key: 'act',
      label: 'Act',
      icon: Zap,
      desc: 'Relevant tools and operational state are updated.',
    },
    {
      key: 'verify',
      label: 'Verify',
      icon: CheckCircle,
      desc: 'The system checks whether the plan is still valid as new information arrives.',
    },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      {/* Desktop: circular-ish layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, i) => {
          const isActive = i === activeStep
          const Icon = step.icon
          return (
            <div
              key={step.key}
              className={`rounded-xl border-2 p-5 space-y-2.5 transition-all duration-500 ${
                isActive
                  ? 'border-teal-300 bg-teal-50/50 shadow-sm'
                  : 'border-slate-150 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`grid size-8 place-items-center rounded-lg transition-colors duration-500 ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Step {i + 1}
                  </span>
                  <h4
                    className={`text-[14px] font-bold transition-colors duration-500 ${
                      isActive ? 'text-teal-800' : 'text-slate-700'
                    }`}
                  >
                    {step.label}
                  </h4>
                </div>
              </div>
              <p className="text-[12.5px] text-slate-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          )
        })}
      </div>

      {/* Loop indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-slate-400">
        <RefreshCw className="size-3.5" />
        <span>Continuous loop — repeats as new information arrives</span>
      </div>
    </div>
  )
}

/* Agent card component */
function AgentCard({ title, subtitle, icon: Icon, receives, responsibility, does, outputs }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-5 space-y-4 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white border border-slate-200 text-slate-600">
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
          <p className="text-[12px] text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 text-[12.5px]">
        <div>
          <p className="font-semibold text-slate-500 mb-0.5">Receives</p>
          <p className="text-slate-600 leading-snug">{receives}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-500 mb-0.5">Responsibility</p>
          <p className="text-slate-600 leading-snug">{responsibility}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-500 mb-0.5">What it does</p>
          <p className="text-slate-600 leading-snug">{does}</p>
        </div>
      </div>

      <div className="rounded-lg bg-white border border-slate-150 px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Outputs</p>
        <p className="text-[12px] text-slate-600">{outputs}</p>
      </div>
    </div>
  )
}

/* Scenario timeline — before / event / after */
function ScenarioTimeline() {
  const phases = [
    {
      label: 'Initial State',
      color: 'bg-teal-500',
      borderColor: 'border-teal-200',
      bgColor: 'bg-teal-50/50',
      content: (
        <>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            A response team has been assigned to evacuate a family reported near 
            the district hospital. The planned route follows the main road corridor.
          </p>
        </>
      ),
    },
    {
      label: 'New Event',
      color: 'bg-red-500',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50/50',
      content: (
        <>
          <div className="space-y-2">
            <div className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[12.5px] text-red-700">
              ⚠ Hospital road reported submerged — depth 1.85m
            </div>
            <div className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12.5px] text-amber-700">
              ⚠ New high-priority report: 12 people stranded nearby
            </div>
          </div>
        </>
      ),
    },
    {
      label: 'System Reassesses',
      color: 'bg-slate-500',
      borderColor: 'border-slate-200',
      bgColor: 'bg-slate-50',
      content: (
        <>
          <div className="space-y-2 text-[12.5px] text-slate-600">
            <div className="flex items-start gap-2">
              <Search className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>Road passability tool detects the route is now impassable</span>
            </div>
            <div className="flex items-start gap-2">
              <Settings2 className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>Shelter capacity tool identifies an alternative high-ground site</span>
            </div>
            <div className="flex items-start gap-2">
              <Shuffle className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>The agent self-corrects, routing to the accessible shelter</span>
            </div>
          </div>
        </>
      ),
    },
    {
      label: 'Updated State',
      color: 'bg-teal-500',
      borderColor: 'border-teal-200',
      bgColor: 'bg-teal-50/50',
      content: (
        <>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            A revised plan is generated and presented to the coordinator. The blocked 
            route is flagged. An alternative evacuation path is proposed. The coordinator 
            reviews and approves the updated dispatch.
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="space-y-0">
      {phases.map((phase, i) => (
        <div key={i} className="relative">
          {/* Connector line */}
          {i > 0 && (
            <div className="absolute left-[15px] -top-3 h-6 w-[2px] bg-slate-200" />
          )}

          <div className="flex gap-4">
            {/* Dot */}
            <div className="flex flex-col items-center pt-1">
              <div className={`size-[10px] rounded-full ${phase.color} ring-4 ring-white shrink-0`} />
              {i < phases.length - 1 && (
                <div className="w-[2px] flex-1 bg-slate-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 rounded-xl border ${phase.borderColor} ${phase.bgColor} p-4 mb-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                {phase.label}
              </p>
              {phase.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* System flow diagram */
function SystemFlowDiagram() {
  const nodes = [
    { label: 'Emergency Information', sub: 'Distress calls, sensor updates, field reports', color: 'border-amber-200 bg-amber-50/60' },
    { label: 'Intake Agent', sub: 'Multilingual NLP extraction & structuring', color: 'border-slate-200 bg-white' },
    { label: 'Priority Engine', sub: 'Deterministic urgency scoring', color: 'border-slate-200 bg-white' },
    { label: 'ReAct Reasoning', sub: 'Tool-calling, obstacle detection, replanning', color: 'border-teal-200 bg-teal-50/60' },
    { label: 'Allocation Engine', sub: 'Constrained fleet matching & dispatch', color: 'border-slate-200 bg-white' },
    { label: 'Coordinator Review', sub: 'Human approval gate for all dispatch decisions', color: 'border-slate-300 bg-slate-50' },
  ]

  return (
    <div className="space-y-0">
      {nodes.map((node, i) => (
        <div key={i}>
          <div className={`rounded-xl border ${node.color} p-4 text-center`}>
            <p className="text-[14px] font-semibold text-slate-800">{node.label}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{node.sub}</p>
          </div>
          {i < nodes.length - 1 && (
            <div className="flex justify-center py-2 text-slate-300">
              <ArrowDown className="size-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
