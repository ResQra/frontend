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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const navigate = useNavigate()
  const { user, setUser, signOut } = useAuth()
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

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
      if (isDev && res.dev_code) {
        setDevCode(res.dev_code)
        setCode(res.dev_code) // Auto-populate for seamless dev/testing UX
      }
      setStep(2)
      setResendIn(30)
      toast.info('Verification Code Sent', {
        description: `6-digit code issued for ${cleanPhone}`,
      })
    } catch (err) {
      setError(err.message)
      if (!err.message || /network|failed to fetch|500/i.test(err.message)) {
        toast.error('Failed to Send OTP', { description: err.message })
      }
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault()
    const cleanPhone = phone.replace(/[^\d+]/g, '').trim()
    const cleanName = name.trim() || 'Resident'
    const cleanCode = code.trim()

    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
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
    setPassword('ResQra123')
    setError('')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 font-sans text-slate-800 selection:bg-slate-900 selection:text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800" />
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      
      {/* Brand Header */}
      <div className="rise relative mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5">
          <span className="brand-mark-sos grid size-11 place-items-center rounded-2xl font-mono text-sm font-black text-white shadow-lg">
            RQ
          </span>
          <span className="font-mono text-2xl font-black tracking-widest text-white">RESQRA</span>
        </div>
        <p className="mt-2 font-mono text-xs text-slate-400">
          Autonomous Disaster Intelligence & Coordination Network
        </p>
      </div>

      {/* Active Session Notification */}
      {user && (
        <div className="mb-4 w-full max-w-md rounded-xl border border-teal-500/40 bg-teal-50/30 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
            <div>
              <p className="font-bold text-slate-800">Signed in as {user.name || user.username || 'User'}</p>
              <p className="text-[11px] text-slate-500 font-mono capitalize">Role: {user.role || 'Coordinator'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate(user.role === 'coordinator' ? '/admin' : '/portal')}
              className="h-7 text-xs bg-slate-900 text-white font-bold hover:bg-slate-700 cursor-pointer"
            >
              Continue →
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { signOut(); toast.info('Signed out successfully') }}
              className="h-7 text-xs border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <Card className="rise relative w-full max-w-md border-white/40 bg-white/95 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.55)] backdrop-blur" style={{ animationDelay: '80ms' }}>
        <CardHeader className="pb-3 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs">
              {mode === 'resident' ? 'Citizen Emergency Helpline' : 'Incident Command Center'}
            </CardTitle>
            <Badge variant="secondary">
              ● SECURE PORTAL
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            {mode === 'resident'
              ? 'Request immediate evacuation, track rescue status, and chat with AI helpline'
              : 'Authorized disaster coordinator & emergency operations personnel login'}
          </CardDescription>

          {/* Mode Switcher Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-mono font-medium border border-slate-200">
            <button
              type="button"
              onClick={() => switchMode('resident')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                mode === 'resident'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="size-3.5" /> Citizen / Resident
            </button>
            <button
              type="button"
              onClick={() => switchMode('official')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                mode === 'official'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
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
                <label className="font-mono text-[11px] font-bold uppercase text-slate-500">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9841234567 or +9779841234567"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-slate-500">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aman Aryan"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-600 focus:border-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/80 bg-red-50/40 p-2.5 text-xs text-red-700 font-mono">
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
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => { setStep(1); setDevCode(null); setCode(''); setError('') }}
                  className="flex items-center gap-1 font-mono text-slate-500 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="size-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={(e) => requestOtp(e)}
                  disabled={busy || resendIn > 0}
                  className="font-mono text-slate-500 hover:text-slate-900 transition disabled:opacity-50"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
              <div className="text-xs text-slate-500 text-right -mt-2">
                <span className="font-mono">
                  Target: <b className="text-slate-700">{phone}</b>
                </span>
              </div>

              {/* Dev mode code display with 1-tap fill */}
              {isDev && devCode && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-2.5 font-mono text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-slate-900" />
                    <span>
                      Dev Code: <b className="text-slate-900 tracking-widest">{devCode}</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200 border border-slate-200"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-slate-500 text-center block">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition"
                  autoFocus
                />
              </div>

              {error && (
                <div role="alert" className="rounded-lg border border-red-900/80 bg-red-50/40 p-2.5 text-xs text-red-700 font-mono">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy || code.length !== 6}
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
                <label className="font-mono text-[11px] font-bold uppercase text-slate-500">
                  Official ID / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. resqra-admin"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="official-password" className="font-mono text-[11px] font-bold uppercase text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <input
                    id="official-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 pl-9 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-2 rounded p-0.5 font-mono text-[10px] font-bold text-slate-400 hover:text-slate-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/80 bg-red-50/40 p-2.5 text-xs text-red-700 font-mono">
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

          {/* Quick Demo Credentials Bar (dev builds only) */}
          {isDev && (
          <div className="mt-5 border-t border-slate-200/80 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                ⚡ Quick Demo Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoResident}
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 hover:border-slate-400 hover:text-slate-900 transition text-left"
              >
                <span className="text-slate-500 block text-[9px]">RESIDENT</span>
                9841234567
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 hover:border-slate-400 hover:text-slate-900 transition text-left"
              >
                <span className="text-slate-500 block text-[9px]">COORDINATOR</span>
                resqra-admin
              </button>
            </div>
          </div>
          )}

        </CardContent>
      </Card>

      {/* Emergency Notice Footer */}
      <p className="rise relative mt-6 max-w-sm text-center font-mono text-[11px] text-slate-400" style={{ animationDelay: '160ms' }}>
        In an immediate life-threatening situation, contact emergency authorities directly at <b className="text-slate-200">112 / 100</b>.
      </p>
    </div>
  )
}
