import { Link, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { LifeBuoy, ArrowUpRight, Activity, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'The Crisis', href: '#crisis' },
    { label: 'Agent Architecture', href: '#agents' },
    { label: 'Dual Console', href: '#experience' },
    { label: 'Benchmarks', href: '#benchmarks' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Live Demos', href: '#launchpad' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs py-3'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-200/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="size-9 rounded-xl bg-sky-600 grid place-items-center text-white shadow-xs group-hover:bg-sky-500 transition-colors">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">ResQra</span>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5">Emergency Disaster Response</p>
          </div>
        </a>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs lg:text-sm font-semibold text-slate-600 hover:text-slate-950 px-3 py-1.5 rounded-lg hover:bg-slate-100/70 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <Activity className="size-3.5 text-amber-600" />
            <span>Judge Sandbox</span>
          </a>
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <span>Open Console</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-white border-b border-slate-200 space-y-2.5 mt-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-lg"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
            <a
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 text-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg font-mono"
            >
              Judge Sandbox
            </a>
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 text-center text-xs font-semibold text-white bg-slate-900 rounded-lg"
            >
              Open Console
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
