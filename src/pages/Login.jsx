import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, LifeBuoy, ShieldCheck } from 'lucide-react'
import { api, saveSession } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('resident')
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
  const { setUser } = useAuth()

  function switchMode(nextMode) {
    setMode(nextMode)
    setStep(1)
    setError('')
  }

  function finish(token, user) {
    saveSession(token, user)
    setUser(user)
    navigate(user.role === 'coordinator' ? '/admin' : '/')
  }

  async function requestOtp(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.requestOtp(phone.trim(), name.trim())
      setDevCode(res.dev_code ?? null)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.verifyOtp(phone.trim(), code.trim(), name.trim())
      finish(res.token, {
        id: res.user_id,
        name: name.trim(),
        phone: phone.trim(),
        role: res.role,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function adminLogin(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.adminLogin(username.trim(), password)
      finish(res.token, {
        id: res.user_id,
        name: res.name || username.trim(),
        phone: '',
        role: res.role,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[15px] transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900'
  const btnCls =
    'w-full rounded-lg bg-slate-900 py-3 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="mb-8 flex flex-col items-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-white text-slate-900 shadow-lg">
          <LifeBuoy className="size-8" strokeWidth={2} />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">ResQra</h1>
        <p className="mt-1 text-[13px] text-slate-400">Flood emergency response, when it matters most</p>
      </div>

      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => switchMode('resident')}
            className={`rounded-lg py-2 transition ${mode === 'resident' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Resident
          </button>
          <button
            type="button"
            onClick={() => switchMode('official')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${mode === 'official' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck className="size-3.5" /> Official
          </button>
        </div>

        {mode === 'resident' && step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Phone number</label>
              <input
                type="tel" inputMode="numeric" required minLength={8}
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX" className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Your name</label>
              <input
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman Kumar" className={inputCls}
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className={btnCls}>
              {busy ? 'Sending code...' : 'Send login code'}
            </button>
            <p className="text-center text-[12px] text-slate-400">
              A 6-digit verification code will be sent to your number.
            </p>
          </form>
        )}

        {mode === 'resident' && step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="flex items-center gap-2 text-[13px] text-slate-600">
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 transition hover:text-slate-900" aria-label="Back">
                <ArrowLeft className="size-4" />
              </button>
              Code sent to <span className="font-semibold text-slate-900">{phone}</span>
            </div>
            {devCode && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
                <KeyRound className="size-4" />
                Test mode: your code is <b className="tracking-[0.2em]">{devCode}</b>
              </div>
            )}
            <input
              type="text" inputMode="numeric" required maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={`${inputCls} text-center text-2xl font-semibold tracking-[0.45em]`}
              autoFocus
            />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <button type="submit" disabled={busy || code.length < 6} className={btnCls}>
              {busy ? 'Verifying...' : 'Verify and continue'}
            </button>
          </form>
        )}

        {mode === 'official' && (
          <form onSubmit={adminLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Official ID</label>
              <input
                type="text" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. resqra-admin" className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</label>
              <input
                type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" className={inputCls}
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className={btnCls}>
              {busy ? 'Signing in...' : 'Open command centre'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 max-w-xs text-center text-[12px] leading-relaxed text-slate-500">
        In a life-threatening emergency, always call the national emergency number 112 first.
      </p>
    </div>
  )
}
