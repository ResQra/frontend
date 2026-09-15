import React from 'react'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import ProblemSection from '../components/landing/ProblemSection.jsx'
import AgentPipeline from '../components/landing/AgentPipeline.jsx'
import DualPersona from '../components/landing/DualPersona.jsx'
import Architecture from '../components/landing/Architecture.jsx'
import FaqSection from '../components/landing/FaqSection.jsx'
import DemoLauncher from '../components/landing/DemoLauncher.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <ProblemSection />
          <AgentPipeline />
          <DualPersona />
          <Architecture />
          <FaqSection />
          <DemoLauncher />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
