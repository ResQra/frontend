import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LifeBuoy,
  Lock,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, saveSession } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Badge } from '../components/ui/badge.jsx'

export default function Login() {
  const [mode, setMode] = useState('resident') // 'resident' | 'official'
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { user, setUser, signOut } = useAuth()

  function switchMode(nextMode) {
    setMode(nextMode)
    setStep(1)
    setError('')
    setCode('')
    setDevCode(null)
  }

  function finish(token, userData) {
    saveSession(token, userData)
    setUser(userData)
    toast.success('Authentication Successful', {
      description: `Welcome back, ${userData.name || 'User'}!`,
    })
    navigate(userData.role === 'coordinator' ? '/admin' : '/portal', { replace: true })
  }

  async function requestOtp(e) {
    if (e) e.preventDefault()
    const cleanPhone = phone.replace(/[^\d+]/g, '').trim()
    const cleanName = name.trim() || 'Resident'

    if (cleanPhone.length < 8) {
      setError('Please enter a valid phone number (minimum 8 digits)')
      return
    }

    setBusy(true)
    setError('')
    try {
      const res = await api.requestOtp(cleanPhone, cleanName)
      if (res.dev_code) {
        setDevCode(res.dev_code)
        setCode(res.dev_code) // Auto-populate for seamless dev/testing UX
      }
      setStep(2)
      toast.info('Verification Code Sent', {
        description: `6-digit code issued for ${cleanPhone}`,
      })
    } catch (err) {
      setError(err.message)
      toast.error('Failed to Send OTP', { description: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault()
    const cleanPhone = phone.replace(/[^\d+]/g, '').trim()
    const cleanName = name.trim() || 'Resident'
    const cleanCode = code.trim()

    if (cleanCode.length < 4) {
      setError('Please enter the verification code')
      return
    }

    setBusy(true)
    setError('')
    try {
      const res = await api.verifyOtp(cleanPhone, cleanCode, cleanName)
      finish(res.token, {
        id: res.user_id,
        name: res.name || cleanName,
        phone: cleanPhone,
        role: res.role || 'resident',
      })
    } catch (err) {
      setError(err.message)
      toast.error('Verification Failed', { description: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function adminLogin(e) {
    if (e) e.preventDefault()
    const cleanUser = username.trim()
    if (!cleanUser || !password) {
      setError('Please enter both Official ID and password')
      return
    }

    setBusy(true)
    setError('')
    try {
      const res = await api.adminLogin(cleanUser, password)
      finish(res.token, {
        id: res.user_id,
        name: res.name || cleanUser,
        phone: '',
        role: res.role || 'coordinator',
      })
    } catch (err) {
      setError(err.message)
      toast.error('Login Failed', { description: err.message })
    } finally {
      setBusy(false)
    }
  }

  // Quick Demo Autofills
  function fillDemoResident() {
    setMode('resident')
    setStep(1)
    setPhone('9841234567')
    setName('Aman Aryan')
    setError('')
  }

  function fillDemoAdmin() {
    setMode('official')
    setUsername('resqra-admin')
    setPassword('resqra-admin-123')
    setError('')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10 font-sans text-zinc-100 selection:bg-white selection:text-black">
      
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white font-mono text-sm font-black text-black shadow-lg">
            RQ
          </span>
          <span className="font-mono text-xl font-black tracking-widest text-white">RESQRA</span>
        </div>
        <p className="mt-2 font-mono text-xs text-zinc-400">
          Autonomous Disaster Intelligence & Coordination Network
        </p>
      </div>

      {/* Active Session Notification */}
      {user && (
        <div className="mb-4 w-full max-w-md rounded-xl border border-teal-500/40 bg-teal-950/30 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
            <div>
              <p className="font-bold text-zinc-100">Signed in as {user.name || user.username || 'User'}</p>
              <p className="text-[11px] text-zinc-400 font-mono capitalize">Role: {user.role || 'Coordinator'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate(user.role === 'coordinator' ? '/admin' : '/portal')}
              className="h-7 text-xs bg-white text-black font-bold hover:bg-zinc-200 cursor-pointer"
            >
              Continue →
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { signOut(); toast.info('Signed out successfully') }}
              className="h-7 text-xs border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <Card className="w-full max-w-md border-zinc-800 bg-[#09090b] shadow-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs">
              {mode === 'resident' ? 'Citizen Emergency Helpline' : 'Incident Command Center'}
            </CardTitle>
            <Badge variant="secondary">
              ● SECURE PORTAL
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            {mode === 'resident'
              ? 'Request immediate evacuation, track rescue status, and chat with AI helpline'
              : 'Authorized disaster coordinator & emergency operations personnel login'}
          </CardDescription>

          {/* Mode Switcher Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-black p-1 text-xs font-mono font-medium border border-zinc-800">
            <button
              type="button"
              onClick={() => switchMode('resident')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                mode === 'resident'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="size-3.5" /> Citizen / Resident
            </button>
            <button
              type="button"
              onClick={() => switchMode('official')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                mode === 'official'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="size-3.5" /> Ops Coordinator
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          
          {/* RESIDENT LOGIN - STEP 1: PHONE & NAME */}
          {mode === 'resident' && step === 1 && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-zinc-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9841234567 or +9779841234567"
                    className="w-full rounded-lg border border-zinc-800 bg-black pl-9 pr-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-zinc-400">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aman Aryan"
                    className="w-full rounded-lg border border-zinc-800 bg-black pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/80 bg-red-950/40 p-2.5 text-xs text-red-300 font-mono">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full font-mono text-xs font-bold"
              >
                {busy ? 'Transmitting code...' : 'Request Login Code →'}
              </Button>
            </form>
          )}

          {/* RESIDENT LOGIN - STEP 2: VERIFY OTP */}
          {mode === 'resident' && step === 2 && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 font-mono text-zinc-400 hover:text-white transition"
                >
                  <ArrowLeft className="size-3.5" /> Back
                </button>
                <span className="font-mono">
                  Target: <b className="text-zinc-200">{phone}</b>
                </span>
              </div>

              {/* Dev mode code display with 1-tap fill */}
              {devCode && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black p-2.5 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-white" />
                    <span>
                      Dev Code: <b className="text-white tracking-widest">{devCode}</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-zinc-400 text-center block">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-zinc-800 bg-black py-2.5 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none transition"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/80 bg-red-950/40 p-2.5 text-xs text-red-300 font-mono">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy || code.length < 4}
                className="w-full font-mono text-xs font-bold"
              >
                {busy ? 'Verifying...' : 'Verify and Continue →'}
              </Button>
            </form>
          )}

          {/* OFFICIAL COORDINATOR LOGIN */}
          {mode === 'official' && (
            <form onSubmit={adminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-zinc-400">
                  Official ID / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. resqra-admin"
                    className="w-full rounded-lg border border-zinc-800 bg-black pl-9 pr-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-black pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/80 bg-red-950/40 p-2.5 text-xs text-red-300 font-mono">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full font-mono text-xs font-bold"
              >
                {busy ? 'Authenticating...' : 'Enter Tactical Console →'}
              </Button>
            </form>
          )}

          {/* Quick Demo Credentials Bar */}
          <div className="mt-5 border-t border-zinc-800/80 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">
                ⚡ Quick Demo Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoResident}
                className="rounded-lg border border-zinc-800 bg-black px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-zinc-700 hover:text-white transition text-left"
              >
                <span className="text-zinc-500 block text-[9px]">RESIDENT</span>
                9841234567
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="rounded-lg border border-zinc-800 bg-black px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-zinc-700 hover:text-white transition text-left"
              >
                <span className="text-zinc-500 block text-[9px]">COORDINATOR</span>
                resqra-admin
              </button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Emergency Notice Footer */}
      <p className="mt-6 max-w-sm text-center font-mono text-[11px] text-zinc-500">
        In an immediate life-threatening situation, contact emergency authorities directly at <b className="text-zinc-300">112 / 100</b>.
      </p>
    </div>
  )
}
