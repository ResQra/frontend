import { Link, useNavigate } from 'react-router-dom'
import React from 'react'
import { LifeBuoy, ExternalLink } from 'lucide-react'

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 text-xs py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg btn-accent grid place-items-center text-white shadow-xs">
                <LifeBuoy className="size-4" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">ResQra</span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-100 border border-slate-200 text-slate-700">
                Official Hackathon Release
              </span>
            </div>
            <p className="text-slate-600 text-xs max-w-md leading-relaxed">
              Autonomous multi-agent disaster response platform coordinating rapid flood triage, deterministic boat dispatch, and empathetic resident communication during acute monsoon crises.
            </p>
            <div className="flex items-center gap-4 text-xs pt-1">
              <a
                href="https://github.com/ResQra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors font-semibold"
              >
                <GithubIcon className="size-3.5" />
                <span>GitHub Repositories</span>
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors font-semibold"
              >
                <ExternalLink className="size-3" />
                <span>API Swagger Docs</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">Navigation</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#crisis" className="hover:text-slate-900 transition-colors">Crisis Failure Modes</a></li>
              <li><a href="#agents" className="hover:text-slate-900 transition-colors">5-Stage Agent Pipeline</a></li>
              <li><a href="#experience" className="hover:text-slate-900 transition-colors">Dual Console Architecture</a></li>
              <li><a href="#benchmarks" className="hover:text-slate-900 transition-colors">Empirical Benchmarks</a></li>
              <li><a href="#faq" className="hover:text-slate-900 transition-colors">Engineering Defense FAQ</a></li>
              <li><a href="#launchpad" className="hover:text-slate-900 transition-colors">Live Interactive Demos</a></li>
            </ul>
          </div>

          {/* Col 3: Core Technology */}
          <div className="space-y-3 font-mono text-[11px]">
            <div className="font-bold text-slate-900 uppercase text-[11px] font-sans tracking-wider">Tech Core</div>
            <ul className="space-y-2">
              <li><span className="text-slate-500">Agents:</span> Strands / ReAct Loops</li>
              <li><span className="text-slate-500">Backend:</span> FastAPI + WebSockets</li>
              <li><span className="text-slate-500">Database:</span> AWS DynamoDB Single-Table</li>
              <li><span className="text-slate-500">Mapping:</span> Leaflet + OpenStreetMap</li>
              <li><span className="text-slate-500">Perception:</span> Groq & Gemini Multimodal</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} ResQra Project. Open-source disaster response coordination.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Built for verifiable, life-critical rescue operations.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
