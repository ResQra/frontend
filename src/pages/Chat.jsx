import { useEffect, useRef, useState } from 'react'
import { LifeBuoy, MapPin, SendHorizonal, ShieldAlert, Sparkles } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([]) // {role:'user'|'agent', content, time}
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    api
      .chatHistory()
      .then((history) =>
        setMessages(
          (history || []).map((m) => ({
            role: m.role === 'agent' ? 'agent' : 'user',
            content: m.content,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          }))
        )
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(e) {
    e?.preventDefault?.()
    const text = input.trim()
    if (!text || busy) return
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text, time: nowTime }])
    setBusy(true)
    try {
      const res = await api.chat(text)
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: `Connection issue: ${err.message}. Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function handleQuickChip(chipText) {
    setInput(chipText)
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-7.5rem)] max-w-3xl flex-col p-3 sm:p-4">
      {/* 1. Header Bar with Rautahat District Context */}
      <div className="mb-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white shadow-xs">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">Rautahat Emergency Copilot</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.2 text-[10px] font-bold text-red-700">
                <span className="size-1.5 rounded-full bg-red-600 animate-ping" />
                DEFCON 1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Gaur & Bagmati Basin · Nepali, Maithili, Bhojpuri & English
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Gaur Bagmati Unit Online</span>
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div className="flex-1 space-y-3.5 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 shadow-inner">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sky-100 text-sky-800 shadow-xs">
              <LifeBuoy className="size-6" />
            </span>
            <p className="mt-3 text-base font-bold text-slate-900">
              Namaste{user?.name ? `, ${(user.name || '').split(' ')[0]}` : ''}. How can I assist you?
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              I have direct access to Rautahat District shelters, water levels, and the Gaur Bagmati Water Rescue Unit. Tell me your exact location or situation.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-1.5 px-2">
              {[
                '📍 I am in Gaur Ward 4 near hospital',
                '🌊 Bagmati water is rising rapidly on our roof',
                '🏥 Where is the nearest open shelter in Gaur?',
                '🚤 Need Gaur Bagmati rescue boat for 6 people',
                'बागमती नदीको बाढीले घर डुबानमा पर्यो',
                'कमला/लालबकैया नदी तटबन्ध मर्मत स्थिति',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickChip(chip)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-100 active:scale-95 text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                m.role === 'user'
                  ? 'rounded-br-xs bg-slate-900 text-white font-medium'
                  : 'rounded-bl-xs border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {m.role === 'agent' && (
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
                  <LifeBuoy className="size-3.5 text-sky-600" />
                  <span>ResQra Rautahat Copilot</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
            {m.time && (
              <span className="mt-1 px-1 text-[10px] text-slate-400 font-mono">
                {m.time}
              </span>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-xs border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <span className="size-2 animate-bounce rounded-full bg-sky-600 [animation-delay:0ms]" />
              <span className="size-2 animate-bounce rounded-full bg-sky-600 [animation-delay:150ms]" />
              <span className="size-2 animate-bounce rounded-full bg-sky-600 [animation-delay:300ms]" />
              <span className="ml-1 text-xs font-semibold text-slate-500">
                Checking Rautahat flood digital twin...
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 3. Input Toolbar & Form */}
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium text-slate-600 no-scrollbar">
          <span className="shrink-0 text-slate-400 mr-1 text-[10px] uppercase font-bold">Quick:</span>
          {['Gaur Ward 3', 'Juddha School', 'Tikuliya Ghat', 'Garuda Bazaar'].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setInput((prev) => (prev ? `${prev} ${loc}` : `I am near ${loc}`))}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition text-[11px]"
            >
              + {loc}
            </button>
          ))}
        </div>

        <form onSubmit={send} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message in Nepali, Maithili, English, Hindi..."
              className="w-full rounded-full border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm shadow-xs transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-35 active:scale-95"
            aria-label="Send"
          >
            <SendHorizonal className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
