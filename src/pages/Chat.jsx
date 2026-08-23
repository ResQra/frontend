import { useEffect, useRef, useState } from 'react'
import { LifeBuoy, SendHorizonal } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([]) // {role:'user'|'agent', content}
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
          }))
        )
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setBusy(true)
    try {
      const res = await api.chat(text)
      setMessages((prev) => [...prev, { role: 'agent', content: res.reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: `Connection issue: ${err.message}. Please try again.` },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-7.5rem)] flex-col px-4 py-4">
      <div className="mb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white">
            <LifeBuoy className="size-5" />
          </span>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900">ResQra Assistant</h1>
            <p className="text-[12px] text-slate-500">
              {busy ? 'typing…' : 'Online — describe your situation in any language'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
        {messages.length === 0 && (
          <div className="pt-10 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400">
              <LifeBuoy className="size-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Hello{user?.name ? `, ${(user.name || '').split(' ')[0]}` : ''}. Tell me your situation.
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-snug text-slate-400">
              "We are 4 people on the rooftop near Gola Road. Water is rising."
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-slate-900 text-white'
                  : 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4.5 py-3 text-[14px] transition focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid size-[46px] shrink-0 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
          aria-label="Send"
        >
          <SendHorizonal className="size-5" />
        </button>
      </form>
    </div>
  )
}
