import { Link, useNavigate } from 'react-router-dom'
import React from 'react'
import { AlertOctagon, CheckCircle2, Zap } from 'lucide-react'
import { PROBLEM_PILLARS } from '../../data/landingData.js'

export default function ProblemSection() {
  return (
    <section id="crisis" className="py-24 relative border-t border-slate-200 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <AlertOctagon className="size-3.5" />
            <span>Crisis Failure Modes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Conventional Disaster Dispatch Breaks Down in Floods
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            When flash floodwaters breach river embankments, emergency services confront three compounding failure modes. ResQra is engineered from the ground up to eliminate all three.
          </p>
        </div>

        {/* 3-Column Structured Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PROBLEM_PILLARS.map((item, idx) => (
            <div
              key={idx}
              className="card-white card-white-hover rounded-2xl p-6 sm:p-7 transition-all flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    STAGE {item.step}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 border border-slate-200 text-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{item.title}</h3>

                {/* Legacy Breakdown Box */}
                <div className="rounded-xl bg-red-50/80 border border-red-200/80 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <AlertOctagon className="size-3" />
                    <span>{item.legacyTitle}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{item.legacyDesc}</p>
                </div>

                {/* ResQra Architecture Box */}
                <div className="rounded-xl badge-accent p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <CheckCircle2 className="size-3" />
                    <span>{item.resqraTitle}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{item.resqraDesc}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Zap className="size-3 text-amber-600" />
                  Outcome: Deterministic safety
                </span>
                <span className="text-[11px] text-slate-400 font-mono font-medium">100% Auditable</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
