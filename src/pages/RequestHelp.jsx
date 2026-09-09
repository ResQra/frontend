import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, LocateFixed, MessageSquare, Siren } from 'lucide-react'
import { api } from '../api.js'
import { Card, PageHeader } from '../components/ui.jsx'

const VULNERABILITIES = ['children', 'elderly', 'pregnant', 'disabled', 'ill', 'injured']

const URGENCY = [
  ['HIGH', 'Urgent', 'Immediate danger to life'],
  ['MEDIUM', 'Soon', 'Help needed within hours'],
  ['LOW', 'Safe for now', 'Precautionary request'],
]

export default function RequestHelp() {
  const [rawText, setRawText] = useState('')
  const [people, setPeople] = useState('')
  const [vulns, setVulns] = useState([])
  const [urgency, setUrgency] = useState('HIGH')
  const [waterRising, setWaterRising] = useState(true)
  const [locationText, setLocationText] = useState('')
  const [gps, setGps] = useState(null)
  const [gpsState, setGpsState] = useState('idle') // idle | busy | ok | denied
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGpsState('denied')
      return
    }
    setGpsState('busy')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setGps({ lat: latitude, lng: longitude, label: 'GPS location' })
        setGpsState('ok')
      },
      () => setGpsState('denied'),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const peopleCount = people === '' ? null : Number(people)
    if (peopleCount !== null && (!Number.isFinite(peopleCount) || peopleCount < 1 || peopleCount > 500)) {
      setError('Tell us how many people need help (1–500).')
      setBusy(false)
      return
    }
    if (!gps && !locationText.trim()) {
      setError('Add a landmark or tap Use GPS — rescuers need a location to reach you.')
      setBusy(false)
      return
    }
    try {
      const item = await api.createIncident({
        raw_text: rawText.trim(),
        people: peopleCount,
        vulnerabilities: vulns,
        urgency,
        water_rising: waterRising,
        location_text: locationText.trim() || null,
        location: gps ? { lat: gps.lat, lng: gps.lng, label: gps.label, confidence: 1.0 } : null,
      })
      setCreated(item)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function resetForm() {
    setCreated(null)
    setRawText('')
    setPeople('')
    setVulns([])
    setUrgency('HIGH')
    setWaterRising(true)
    setLocationText('')
    setGps(null)
    setGpsState('idle')
    setError('')
  }

  if (created) {
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Request submitted</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Your request ID is{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800">{created.id}</code>.
          It has entered the rescue coordination queue and is live on the coordinator map. Keep your phone
          with you and stay where you are if it is safe.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/track"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Track my request
          </Link>
          <button
            onClick={resetForm}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            File another report
          </button>
          <Link
            to="/portal"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </div>
    )
  }

  const label = 'mb-1.5 block text-[13px] font-medium text-slate-700'
  const input =
    'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[15px] transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900'

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title="Request Emergency Help"
        subtitle="This information goes directly to the rescue coordination centre"
      />

      <div>
        <label className={label}>
          What is happening? <span className="text-red-600">*</span>
        </label>
        <textarea
          required
          minLength={3}
          rows={4}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="e.g. Water has entered our house in Kankarbagh. We have moved to the rooftop."
          className={`${input} resize-none`}
        />
      </div>

      <div>
        <label className={label}>People with you</label>
        <input
          type="number" min="1"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          placeholder="e.g. 6"
          className={input}
        />
      </div>

      <div>
        <span className={label} id="urgency-label">How urgent is it?</span>
          <div role="radiogroup" aria-labelledby="urgency-label" className="grid grid-cols-3 gap-2">
            {URGENCY.map(([v, t, d]) => {
              const on = urgency === v
              const accent = v === 'HIGH'
                ? 'border-red-500 bg-red-50 text-red-800 ring-red-200'
                : v === 'MEDIUM'
                  ? 'border-amber-400 bg-amber-50 text-amber-900 ring-amber-200'
                  : 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-emerald-200'
              return (
                <button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setUrgency(v)}
                  className={`rounded-2xl border-2 px-2 py-2.5 text-center transition active:scale-95 ${
                    on ? `${accent} shadow-sm ring-2` : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[13px] font-extrabold">{t}</span>
                  <span className={`mt-0.5 block text-[10px] leading-tight ${on ? '' : 'text-slate-400'}`}>{d}</span>
                </button>
              )
            })}
          </div>
      </div>

      <div>
        <label className={label}>Anyone needing special care?</label>
        <div className="flex flex-wrap gap-2">
          {VULNERABILITIES.map((v) => {
            const on = vulns.includes(v)
            return (
              <button
                type="button"
                key={v}
                onClick={() => setVulns((prev) => (on ? prev.filter((x) => x !== v) : [...prev, v]))}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                  on
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {on && <Check className="size-3.5" />}
                {v}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className={label}>Your location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Nearest landmark, e.g. Gola Road school"
            className={`flex-1 ${input}`}
          />
          <button
            type="button"
            onClick={useMyLocation}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition ${
              gpsState === 'ok'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LocateFixed className={`size-4 ${gpsState === 'busy' ? 'animate-pulse' : ''}`} />
            {gpsState === 'busy' ? 'Locating…' : gpsState === 'ok' ? 'GPS attached' : gpsState === 'denied' ? 'GPS unavailable' : 'Use GPS'}
          </button>
        </div>
        {gpsState === 'ok' && gps && (
          <p className="mt-1.5 text-[12px] font-medium text-emerald-700">
            Exact coordinates attached ({gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}) — rescuers can find
            you precisely. A landmark helps too.
          </p>
        )}
        {gpsState === 'denied' && (
          <p className="mt-1.5 text-[12px] text-amber-700">
            GPS blocked — the landmark you type will be used to locate you.
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={waterRising}
        aria-label="Water level is rising"
        onClick={() => setWaterRising((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
      >
        <span className="text-sm font-medium text-slate-800">Water level is rising</span>
        <span
          className={`relative h-6 w-11 rounded-full transition ${waterRising ? 'bg-sky-600' : 'bg-slate-300'}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${waterRising ? 'left-[22px]' : 'left-0.5'}`}
          />
        </span>
      </button>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="sticky bottom-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-[15px] font-extrabold text-white shadow-[0_16px_40px_-12px_rgba(220,38,38,0.55)] transition hover:brightness-110 disabled:opacity-60"
      >
        <Siren className="size-5" />
        {busy ? 'Submitting…' : 'SEND EMERGENCY REQUEST'}
      </button>

      <Card className="flex items-start gap-3 px-4 py-3.5">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p className="text-[13px] leading-snug text-slate-600">
          Prefer talking?{' '}
          <Link to="/chat" className="font-semibold text-sky-700 hover:text-sky-900">
            Chat with ResQra
          </Link>{' '}
          — it builds this request from your messages automatically.
        </p>
      </Card>
    </form>
  )
}
