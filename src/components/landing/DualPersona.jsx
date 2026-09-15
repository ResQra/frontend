import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import {
  Smartphone,
  Monitor,
  Siren,
  Shield,
  MessageSquare,
  MapPin,
  CheckCircle,
  ArrowRight,
  Radio,
  Compass,
  Users,
  Anchor,
  Activity,
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle
} from 'lucide-react'
import { DUAL_PERSONA } from '../../data/landingData.js'

export default function DualPersona() {
  const [activeTab, setActiveTab] = useState('resident')
  const [mockApproved, setMockApproved] = useState(false)

  const current = DUAL_PERSONA[activeTab]

  return (
    <section id="experience" className="py-24 relative bg-slate-50/70 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-accent text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <Users className="size-3.5" />
            <span>Dual-Persona Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Both Sides of the Disaster
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            A crisis demands two radically different interfaces: an ultra-simple, reassuring mobile lifeline for citizens, and a high-density tactical cockpit for command coordinators.
          </p>

          {/* Persona Switcher Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-xs mt-8">
            <button
              type="button"
              onClick={() => setActiveTab('resident')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                activeTab === 'resident'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Resident Life-Line (PWA)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coordinator')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                activeTab === 'coordinator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Command Center Console</span>
            </button>
          </div>
        </div>

        {/* Dynamic Persona Container */}
        <div className="card-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Highlights */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
                  {current.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  {current.title}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">{current.subtitle}</p>
              </div>

              <div className="space-y-3">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex gap-3.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="size-6 rounded-md bg-white border border-slate-200 grid place-items-center shrink-0 text-accent mt-0.5 shadow-xs">
                      <CheckCircle className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{h.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <a
                  href={activeTab === 'resident' ? 'http://localhost:5173' : 'http://localhost:5173/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold btn-accent transition-all font-sans cursor-pointer shadow-sm"
                >
                  <span>{activeTab === 'resident' ? 'Launch Resident App (:5173)' : 'Open Control Room (/admin)'}</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>

            {/* Right: Simulated Interface Preview */}
            <div className="lg:col-span-6">
              {activeTab === 'resident' ? (
                /* Resident Mobile Preview in Silver/Slate Bezel */
                <div className="max-w-sm mx-auto rounded-[36px] bg-slate-100 border-4 border-slate-300 p-3.5 shadow-xl relative">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-3 bg-slate-300 rounded-full mx-auto mb-3.5"></div>

                  <div className="space-y-3 text-left font-sans bg-white p-3.5 rounded-[24px] border border-slate-200 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-md btn-accent grid place-items-center text-white font-extrabold text-xs">
                          R
                        </span>
                        <span className="font-bold text-xs text-slate-900">ResQra Emergency</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        GPS CONNECTED
                      </span>
                    </div>

                    {/* Big SOS Button */}
                    <div className="p-4 rounded-xl bg-red-600 text-center shadow-md shadow-red-600/20 text-white">
                      <Siren className="size-8 mx-auto mb-1.5 animate-pulse" />
                      <div className="text-base font-extrabold tracking-wide">ONE-TAP SOS BEACON</div>
                      <div className="text-[10px] text-red-100 opacity-95 mt-0.5 font-mono">
                        Direct satellite & cell dispatch
                      </div>
                    </div>

                    {/* Live Copilot Chat Snippet */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <div className="text-[10px] text-accent font-mono font-bold uppercase">Multilingual Copilot</div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] leading-relaxed shadow-xs">
                        "Stay on your rooftop. Team Gaur Bagmati has been dispatched with a high-capacity inflatable boat. ETA is 8 minutes."
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
                        <span>Language: Maithili / English</span>
                        <span className="text-emerald-600 font-semibold">Shelter: Juddha School (800m)</span>
                      </div>
                    </div>

                    {/* Status Tracking Pill */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Rescue Status:</span>
                      <span className="font-bold text-amber-700 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        BOAT SQUADRON EN ROUTE
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Coordinator Tactical Console Preview */
                <div className="rounded-xl bg-white border border-slate-200 p-4 text-left space-y-3 font-mono text-xs shadow-md">
                  {/* Console Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-slate-900 text-xs">TACTICAL GIS COMMAND CONSOLE</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      DISASTER SECTOR: HIGH-WATER BASIN
                    </span>
                  </div>

                  {/* Simulated Tactical Map Canvas */}
                  <div className="h-44 rounded-lg bg-slate-50 border border-slate-200 relative overflow-hidden flex flex-col justify-between p-3">
                    <div className="absolute inset-0 daylight-grid-bg opacity-70 pointer-events-none"></div>

                    {/* Top Overlay Badge */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <Compass className="size-3 text-accent" />
                        SECTOR 4 FLOODPLAIN CORRIDOR
                      </span>
                      <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        SURGE: +1.2M/HR
                      </span>
                    </div>

                    {/* Tactical Markers */}
                    <div className="relative z-10 space-y-1.5 text-[10px]">
                      <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded shadow-xs font-bold">
                        <Siren className="size-3 text-red-600 animate-pulse" />
                        <span>CRITICAL BEACON #842: 7 Victims on Rooftop</span>
                      </div>
                      <div className="block"></div>
                      <div className="inline-flex items-center gap-1.5 badge-accent px-2.5 py-1 rounded shadow-xs font-semibold">
                        <Anchor className="size-3" />
                        <span>SQUADRON ALPHA: Swift-water Boat Patrol</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive HITL Action Card */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <Shield className="size-3.5 text-slate-500" />
                        PENDING ACTION CARD (HITL)
                      </span>
                      {mockApproved ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="size-2.5" />
                          MISSION DISPATCHED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                          NEEDS OFFICIAL SIGN-OFF
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Target: Sector 4 Embankment Breach • Squadron: Swift-water Motorboat (Cap 16)
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      {!mockApproved ? (
                        <button
                          type="button"
                          onClick={() => setMockApproved(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="size-3" />
                          <span>Authorize Launch (1-Click)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMockApproved(false)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] transition-all cursor-pointer font-bold"
                        >
                          Reset Interactive Simulation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
