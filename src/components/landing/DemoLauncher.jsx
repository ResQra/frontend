import { Link, useNavigate } from 'react-router-dom'
import React from 'react'
import { ArrowUpRight, Play, Server, Monitor, Smartphone, Activity } from 'lucide-react'
import { DEMO_LAUNCHPAD } from '../../data/landingData.js'

export default function DemoLauncher() {
  const iconList = [Smartphone, Monitor, Activity, Server]

  return (
    <section id="launchpad" className="py-24 relative bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <Play className="size-3.5 text-emerald-600" />
            <span>Interactive Operational Stack</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Launch the ResQra Ecosystem
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            Every layer of the ResQra stack is decoupled, tested, and operational. Select an interface below to inspect the resident experience, command dispatch operations, or our automated evaluation suite.
          </p>
        </div>

        {/* 4 Launchpad Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMO_LAUNCHPAD.map((item, idx) => {
            const Icon = iconList[idx] || Monitor
            const fullUrl = item.port === 5174 ? '/demo' : item.port === 5173 && item.path.includes('login') ? '/admin' : item.port === 5173 ? '/portal' : '/api/docs'

            return (
              <div
                key={idx}
                className="card-white card-white-hover rounded-2xl p-6 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-xl bg-slate-50 border border-slate-200 grid place-items-center text-accent shadow-xs">
                      <Icon className="size-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">{item.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">{item.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold btn-accent transition-all flex items-center justify-center gap-2 font-sans cursor-pointer shadow-xs"
                  >
                    <span>{item.cta}</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                  <div className="text-[10px] font-mono text-slate-500 text-center mt-2.5">
                    Port {item.port} • Active Local Service
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
