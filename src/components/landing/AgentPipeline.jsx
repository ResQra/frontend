import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import { Radio, ShieldAlert, Anchor, Compass, CheckCircle2, Cpu, Terminal } from 'lucide-react'
import { AGENT_PIPELINE } from '../../data/landingData.js'

export default function AgentPipeline() {
  const [activeStep, setActiveStep] = useState(0)

  const iconMap = {
    Radio: Radio,
    ShieldAlert: ShieldAlert,
    Anchor: Anchor,
    Compass: Compass,
    CheckCircle2: CheckCircle2,
  }

  const active = AGENT_PIPELINE[activeStep]
  const ActiveIcon = iconMap[active.icon] || Cpu

  return (
    <section id="agents" className="py-24 relative bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-accent text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <Cpu className="size-3.5" />
            <span>Autonomous Coordination Core</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The 5-Stage Autonomous Multi-Agent Pipeline
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            Perception is executed by multimodal language models. Life-critical decisions are locked into deterministic, mathematically verified algorithms.
          </p>
        </div>

        {/* Horizontal Navigation Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-8">
          {AGENT_PIPELINE.map((agent, idx) => {
            const Icon = iconMap[agent.icon] || Cpu
            const isCurrent = idx === activeStep
            return (
              <button
                key={agent.step}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`text-left p-3.5 rounded-xl transition-all border cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-mono text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                    STAGE {agent.step}
                  </span>
                  <Icon className={`size-3.5 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs sm:text-sm font-bold truncate">{agent.name}</div>
                <div className={`text-[11px] truncate mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                  {agent.role}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detailed Active Stage Inspector */}
        <div className="card-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700">
                  STAGE {active.step}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold badge-accent">
                  {active.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-500">ENGINE: {active.tech}</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <ActiveIcon className="size-6 text-accent" />
                <span>{active.name}</span>
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed">
                {active.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Execution Model</div>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {activeStep === 0 ? 'Generative NLP + Geocoder' : activeStep === 4 ? 'Human-in-the-Loop Sign-Off' : 'Deterministic Math Solver'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Safety Guarantee</div>
                  <div className="text-emerald-700 font-bold mt-0.5">
                    {activeStep === 0 ? 'Strict JSON Schema Validation' : activeStep === 4 ? 'Mandatory Coordinator Auth' : 'Zero Hallucination Guaranteed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical I/O Telemetry Inspector (Developer-grade dark container for code legibility) */}
            <div className="lg:col-span-6 rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px]">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-sky-400" />
                  RUNTIME I/O CONTRACT
                </span>
                <span className="text-emerald-400 font-semibold">STATUS: VERIFIED</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">// Input Signal Sample:</span>
                  <div className="mt-1 p-2.5 rounded bg-black/40 border border-slate-800 text-amber-300 text-[11px] leading-relaxed">
                    {active.inputSample}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase">// Structured Output Schema:</span>
                  <pre className="mt-1 p-3 rounded bg-black/40 border border-slate-800 text-slate-200 text-[11px] leading-relaxed overflow-x-auto">
                    {JSON.stringify(active.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
