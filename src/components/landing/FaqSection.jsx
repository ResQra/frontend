import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { FAQ_DATA } from '../../data/landingData.js'

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="py-24 relative bg-slate-50/70 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-accent text-xs font-mono uppercase tracking-wider mb-4 shadow-xs">
            <ShieldCheck className="size-3.5" />
            <span>Technical Defense & Evaluation FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Engineering Questions
          </h2>
          <p className="mt-3.5 text-slate-600 text-base sm:text-lg leading-relaxed">
            Key architectural, safety, and logistical questions addressed for evaluators, disaster response agencies, and engineering judges.
          </p>
        </div>

        {/* Accordion Cards */}
        <div className="space-y-3">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = idx === openIndex
            return (
              <div
                key={idx}
                className="card-white rounded-xl shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {item.q}
                  </span>
                  <span className="p-1 rounded-md bg-slate-100 text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
