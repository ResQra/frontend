import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Siren,
  Activity,
  Cpu,
  Anchor,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { HERO_DATA } from '../../data/landingData.js'

export default function Hero() {
  const [selectedIncident, setSelectedIncident] = useState(0)
  const [approvedMissions, setApprovedMissions] = useState({})

  const sampleIncidents = [
    {
      id: "INC-901",
      sector: "Sector 4 (Bagmati Breach)",
      message: "6 people stranded on school roof, 2 infants, water rising fast (+1.2m/hr)",
      dialect: "Maithili / Romanized",
      people: 6,
      urgency: "HIGH",
      vulnerabilities: ["infants", "elderly"],
      score: "11.2 / 12.0",
      band: "CRITICAL",
      bandColor: "bg-red-50 text-red-700 border-red-200",
      recommendedSquad: "GAUR BAGMATI WATER RESCUE UNIT",
      vessel: "Swift-water Motorboat Patrol",
      capacity: 16,
      eta: "7.8 mins",
    },
    {
      id: "INC-902",
      sector: "Sector 2 (Customs Road)",
      message: "Elderly couple unable to evacuate ground floor, water at 3 feet",
      dialect: "Bhojpuri / Hindi",
      people: 2,
      urgency: "MEDIUM",
      vulnerabilities: ["elderly", "limited_mobility"],
      score: "8.4 / 12.0",
      band: "HIGH",
      bandColor: "bg-amber-50 text-amber-700 border-amber-200",
      recommendedSquad: "APF BATTALION NO. 11 SQUAD",
      vessel: "Amphibious Extraction Unit",
      capacity: 22,
      eta: "11.2 mins",
    },
    {
      id: "INC-903",
      sector: "Sector 7 (Tikuliya Ghat)",
      message: "4 farmers trapped on elevated knoll across river branch",
      dialect: "Nepali / English",
      people: 4,
      urgency: "MODERATE",
      vulnerabilities: [],
      score: "6.1 / 12.0",
      band: "MEDIUM",
      bandColor: "bg-sky-50 text-sky-700 border-sky-200",
      recommendedSquad: "LALBAKAIYA TIKULIYA FLOOD UNIT",
      vessel: "Light Motor Raft",
      capacity: 10,
      eta: "14.5 mins",
    },
  ]

  const active = sampleIncidents[selectedIncident]
  const isApproved = approvedMissions[active.id]

  const handleToggleApprove = (id) => {
    setApprovedMissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#f8fafc] daylight-grid-bg">
      {/* Subtle Top Ambient Light Glow */}
      <div className="absolute inset-0 ambient-light-glow pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header & Core Value Prop */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono mb-6 shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">{HERO_DATA.statusBadge}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{HERO_DATA.systemHealth}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-6">
            {HERO_DATA.headlineMain}{' '}
            <span className="block mt-1 text-accent">
              {HERO_DATA.headlineHighlight}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-9">
            {HERO_DATA.subhead}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <a
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold btn-accent shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Activity className="size-4 text-white" />
              <span>Launch Judge Sandbox (4-Act Simulation)</span>
              <ArrowRight className="size-3.5" />
            </a>

            <a
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Siren className="size-4 text-accent" />
              <span>Resident Life-Line (PWA)</span>
            </a>

            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Command Console (/admin)</span>
              <ArrowUpRight className="size-3.5 opacity-60" />
            </a>
          </div>

          {/* 4-Stat Metrics Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl mx-auto mb-16">
            {HERO_DATA.metrics.map((m, i) => (
              <div
                key={i}
                className="card-white card-white-hover rounded-xl p-5 text-left transition-all"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mb-1">
                  {m.value}
                </div>
                <div className="text-xs font-bold text-slate-800 tracking-tight">{m.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Fidelity Interactive Command Preview Workstation */}
        <div className="max-w-6xl mx-auto card-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden border border-slate-200">
          {/* Workstation Top Bar */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-800">TACTICAL DISPATCH WORKSTATION</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px]">ACTIVE SECTOR: RAUTAHAT FLOOD BASIN</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span className="hidden sm:inline">CYCLE: 30s SWEEPER</span>
              <span className="text-emerald-600 font-semibold">STATE: SYNCED</span>
            </div>
          </div>

          {/* 3-Column Interactive Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
            {/* Left: Interactive Ingestion Queue */}
            <div className="lg:col-span-4 p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-1">
                <span className="font-bold text-slate-700">INCOMING DISTRESS SIGNALS</span>
                <span className="text-[10px]">CLICK TO INSPECT</span>
              </div>

              <div className="space-y-2">
                {sampleIncidents.map((inc, index) => {
                  const isSelected = index === selectedIncident
                  return (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => setSelectedIncident(index)}
                      className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-50 border-slate-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${inc.bandColor}`}>
                          {inc.band}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-semibold truncate">{inc.sector}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        {inc.people} Victims • {inc.dialect}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Center: Real-Time Deterministic Triage Breakdown */}
            <div className="lg:col-span-4 p-4 space-y-3 font-mono text-xs bg-slate-50/40">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-accent" />
                  DETERMINISTIC SCORING ENGINE
                </span>
                <span className="text-slate-400">ID: {active.id}</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Perception Extraction:</span>
                  <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 text-[11px] leading-relaxed shadow-xs">
                    "{active.message}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Headcount Factor:</span>
                    <span className="font-semibold text-slate-900">+{active.people * 0.5} pts ({active.people} people)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Vulnerabilities:</span>
                    <span className="text-amber-700 font-bold">
                      {active.vulnerabilities.length > 0 ? active.vulnerabilities.join(', ') : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 border-t border-slate-100 pt-1.5">
                    <span className="font-bold text-slate-900">Total Priority Index:</span>
                    <span className="text-emerald-600 font-bold">{active.score}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-normal">
                  * 100% reproducible and grounded. Zero generative drift in life-critical risk ranking.
                </div>
              </div>
            </div>

            {/* Right: Human-in-the-Loop Action Approval Card */}
            <div className="lg:col-span-4 p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Anchor className="size-3.5 text-accent" />
                  COMMAND ACTION CARD (HITL)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isApproved ? 'DISPATCHED' : 'AWAITING APPROVAL'}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Recommended Squadron:</div>
                  <div className="text-slate-900 font-bold truncate">{active.recommendedSquad}</div>
                  <div className="text-slate-600 text-[10px]">{active.vessel} (Cap {active.capacity})</div>
                  <div className="text-slate-500 text-[10px] flex justify-between pt-1">
                    <span>Estimated ETA: {active.eta}</span>
                    <span className="text-emerald-600 font-semibold">Channel Passable</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleApprove(active.id)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                      isApproved
                        ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>{isApproved ? 'Reset Simulated Mission' : 'Authorize Launch (1-Click)'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    Simulates official coordinator authorization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
