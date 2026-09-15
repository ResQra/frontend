import { Link, useNavigate } from 'react-router-dom'
import React from 'react'
import { Lock, Globe, Cpu, Database, BarChart3, Check, XCircle } from 'lucide-react'
import { BENCHMARK_COMPARISON } from '../../data/landingData.js'

export default function Architecture() {
  return (
    <section id="benchmarks" className="py-24 relative bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <BarChart3 className="size-3.5 text-emerald-600" />
            <span>Empirical Benchmarks & Safety Defense</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Generative AI Alone is Dangerous in Disasters
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            In swift-water flood rescue, hallucinating a phantom boat or miscalculating an elevation route has fatal consequences. ResQra replaces unconstrained prompt chains with grounded ReAct loops.
          </p>
        </div>

        {/* Benchmark Evaluation Table */}
        <div className="card-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-16">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-800">RESQRA-BENCH EVALUATION SUITE</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">N=250 REALISTIC FLOOD EMERGENCIES</span>
            </div>
            <span className="text-slate-500 text-[11px]">BASELINE: UNCONSTRAINED GPT-4 / CLAUDE DISPATCH</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-5">Operational Metric</th>
                  <th className="py-3.5 px-5 text-emerald-700 font-bold">ResQra Grounded ReAct</th>
                  <th className="py-3.5 px-5 text-slate-600">Baseline Prompting</th>
                  <th className="py-3.5 px-5 text-slate-600">Mission Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {BENCHMARK_COMPARISON.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {row.metric}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span className="font-mono font-bold text-emerald-700">{row.resqra}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{row.resqraDetail}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-red-500 shrink-0" />
                        <span className="font-mono font-semibold text-slate-600">{row.baseline}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.baselineDetail}</div>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-800">
                      {row.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-white card-white-hover rounded-xl p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-lg bg-sky-50 border border-sky-200 grid place-items-center text-sky-700 mb-3">
              <Lock className="size-4.5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Zero-Hallucination Boundary</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              LLMs are strictly restricted to language perception and translation. All triage scores, distance vectors, and boat allocation rely on deterministic code.
            </p>
          </div>

          <div className="card-white card-white-hover rounded-xl p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-lg bg-emerald-50 border border-emerald-200 grid place-items-center text-emerald-700 mb-3">
              <Globe className="size-4.5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Universal Basin Schema</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open geographic schema. Calibrated with authentic OSM/HDX data for Nepal's floodplains, but instantly portable to any river basin worldwide.
            </p>
          </div>

          <div className="card-white card-white-hover rounded-xl p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center text-amber-700 mb-3">
              <Cpu className="size-4.5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Decoupled Agent Gateway</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              FastAPI exposes a clean contract seam allowing local in-process Strands agents during dev, or AWS Bedrock AgentCore in massive production scale.
            </p>
          </div>

          <div className="card-white card-white-hover rounded-xl p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-lg bg-purple-50 border border-purple-200 grid place-items-center text-purple-700 mb-3">
              <Database className="size-4.5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">High-Concurrency Data Tier</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Powered by AWS DynamoDB with single-table design principles for sub-5ms lookups and zero row contention during peak disaster surges.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
