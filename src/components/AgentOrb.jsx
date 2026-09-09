import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { api, getToken } from '../api.js'

/* Phase 4 floating agent orb — Jarvis-style presence over the console.
 * Voice goes through the backend (/api/ops/assistant/voice, Gemini
 * transcription + spoken reply), never the browser's cloud speech service.
 * Same session backend as the AI Chat tab (a persistent "Voice console"
 * session), same supervisor + explicit-command pipeline. Workspace intents
 * (focus incident, navigate, mark region) execute locally.
 */

function micReady() {
  return typeof window !== 'undefined' && !!window.MediaRecorder &&
    !!navigator.mediaDevices?.getUserMedia
}

function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export default function AgentOrb({ area, roadBounds, selectedId, onFocusIncident,
                                   onNavigate, onMarkRegion }) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [caption, setCaption] = useState('')
  const [lastReply, setLastReply] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const recorderRef = useRef(null)
  const onceTimerRef = useRef(null)
  const chunksRef = useRef([])
  const sessionRef = useRef(null)
  // Live duplex conversation over the backend's Gemini Live proxy socket.
  // No voice-activity timers: audio streams continuously both ways and
  // interruption is server-driven (an `interrupted` frame drops playback).
  const [live, setLive] = useState(false)
  const liveRef = useRef(false)
  const thinkingRef = useRef(false)
  const speakingRef = useRef(false)
  const playingRef = useRef(false)
  const mutedRef = useRef(false)
  const streamRef = useRef(null)
  const capCtxRef = useRef(null)
  const playCtxRef = useRef(null)
  const liveWsRef = useRef(null)
  const playNextRef = useRef(0)
  const playSourcesRef = useRef(new Set())
  const inAccumRef = useRef('')
  const outAccumRef = useRef('')
  const firedIntentRef = useRef(null)
  const audioElRef = useRef(null)

  useEffect(() => {
    sessionRef.current = sessionId
  }, [sessionId])
  // Warm the browser voice list early (Chrome fills it async) so the
  // instant-voice fast path is ready when a reply lands.
  useEffect(() => {
    try {
      window.speechSynthesis?.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices() } catch { /* noop */ }
      }
    } catch { /* noop */ }
  }, [])
  useEffect(() => () => {
    try { stopLive() } catch { /* noop */ }
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    try { if (onceTimerRef.current) clearTimeout(onceTimerRef.current) } catch { /* noop */ }
    try { playCtxRef.current?.close?.()?.catch?.(() => {}) } catch { /* noop */ }
    playCtxRef.current = null
  }, [])

  function speak(text) {
    if (mutedRef.current || !ttsSupported()) return
    try {
      window.speechSynthesis.cancel()
      const clean = String(text || '').replace(/[*_`#]/g, '').slice(0, 400)
      if (!clean.trim()) return
      const utter = new SpeechSynthesisUtterance(clean)
      utter.rate = 1.05
      // While the browser is speaking, suspend VAD so the speakers don't
      // re-trigger the mic into a feedback loop.
      speakingRef.current = true
      utter.onend = () => { speakingRef.current = false }
      utter.onerror = () => { speakingRef.current = false }
      window.speechSynthesis.speak(utter)
    } catch {
      speakingRef.current = false
    }
  }

  async function ensureSession() {
    if (sessionRef.current) return sessionRef.current
    const list = await api.listChatSessions()
    const existing = (list.sessions || []).find((s) => s.title === 'Voice console')
    const sid = existing
      ? existing.session_id
      : (await api.createChatSession({ title: 'Voice console', area })).session.session_id
    sessionRef.current = sid
    setSessionId(sid)
    return sid
  }

  // Local workspace intents — navigation needs no LLM round-trip.
  function tryLocalIntent(text) {
    const t = text.trim()
    let m = t.match(/^(show|focus|open)\s+(incident\s+)?(inc_[\w-]+)/i)
    if (m) {
      onFocusIncident?.(m[3])
      return `Focusing ${m[3]} on the tactical map.`
    }
    m = t.match(/^(go to|open|show)\s+(tactical map|map|teams|chat|kpis|analytics|bulletins|advisories)/i)
    if (m) {
      const views = { map: 'dispatch', teams: 'teams', chat: 'chat',
                      kpis: 'kpis', analytics: 'kpis', bulletins: 'advisories', advisories: 'advisories' }
      onNavigate?.(views[m[2].toLowerCase()] || 'dispatch')
      return `Opening ${m[2]}.`
    }
    if (/^(mark|select)\s+(a\s+)?region/i.test(t)) {
      onMarkRegion?.()
      return 'Region mode on — click two corners on the tactical map.'
    }
    return null
  }

  function stopPlayback() {
    playingRef.current = false
    try { audioElRef.current?.pause() } catch { /* noop */ }
    audioElRef.current = null
  }

  function playReplyUrl(url) {
    stopPlayback()
    return new Promise((resolve) => {
      const done = () => {
        playingRef.current = false
        audioElRef.current = null
        try { URL.revokeObjectURL(url) } catch { /* noop */ }
        resolve()
      }
      try {
        const el = new Audio(url)
        audioElRef.current = el
        playingRef.current = true
        el.onended = done
        el.onerror = done
        el.play().catch(done)
      } catch {
        done()
      }
    })
  }

  function browserVoiceReady() {
    try {
      return ttsSupported() && window.speechSynthesis.getVoices().length > 0
    } catch {
      return false
    }
  }

  async function sendVoice(blob) {
    // Orb runs on local thinking state only — the global console busy flag
    // is for ops approvals, and voice must never freeze the Decision Cockpit.
    setThinking(true)
    thinkingRef.current = true
    // Instant-voice fast path: a local voice speaks the reply in ~0 s.
    // Server audio (nicer voice, +7-12 s) is only requested when the
    // browser has no voice installed — the turn then stays text-fast.
    const instantVoice = !mutedRef.current && browserVoiceReady()
    try {
      const sid = await ensureSession()
      const res = await api.assistantVoice(blob, { session_id: sid, area, tts: !instantVoice && !muted })
      const heard = (res.transcript || '').trim()
      if (heard) setCaption(`You: ${heard}`)
      const local = heard ? tryLocalIntent(heard) : null
      if (local) {
        setLastReply(local)
        setCaption(liveRef.current ? `Live — speak anytime. (${local})` : local)
        speak(local)
        return
      }
      const reply = res.reply || '(no reply)'
      setLastReply(reply)
      setCaption(reply)
      if (instantVoice) {
        speak(reply)
      } else if (!muted && res.audio_b64) {
        try {
          const bin = atob(res.audio_b64)
          const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          const url = URL.createObjectURL(
            new Blob([bytes], { type: res.audio_mime || 'audio/wav' }))
          await playReplyUrl(url)
        } catch {
          speak(reply)
        }
      } else {
        speak(reply)
      }
      if (liveRef.current) setCaption('Live — speak anytime. Tap orb to end.')
    } catch (err) {
      const msg = `Voice failed: ${err.message}`
      setCaption(msg)
      toast.error('Orb voice failed', { description: err.message })
    } finally {
      setThinking(false)
      thinkingRef.current = false
    }
  }

  // ---- Live duplex capture: mic -> 16k PCM -> Live socket ----

  const CAP_WORKLET = `
    class Cap extends AudioWorkletProcessor {
      constructor() {
        super()
        this.ratio = sampleRate / 16000
        this.acc = 0
        this.buf = []
      }
      process(inputs) {
        const ch = inputs[0] && inputs[0][0]
        if (!ch) return true
        for (let i = 0; i < ch.length; i++) {
          this.acc += 1
          if (this.acc >= this.ratio) {
            this.acc -= this.ratio
            const s = Math.max(-1, Math.min(1, ch[i]))
            this.buf.push(s < 0 ? s * 0x8000 : s * 0x7FFF)
            if (this.buf.length >= 960) {
              this.port.postMessage(new Int16Array(this.buf.splice(0, 960)))
              this.buf = []
            }
          }
        }
        return true
      }
    }
    registerProcessor('resqra-cap', Cap)
  `

  function int16ToB64(pcm) {
    const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength)
    let bin = ''
    for (let i = 0; i < bytes.length; i += 8192) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192))
    }
    return btoa(bin)
  }

  function sendMicChunk(pcm) {
    const ws = liveWsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(JSON.stringify({ type: 'audio', data: int16ToB64(pcm) }))
    } catch { /* drop chunk */ }
  }

  async function startCapture(stream) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx({ latencyHint: 'interactive' })
    capCtxRef.current = ctx
    try { await ctx.resume() } catch { /* noop */ }
    const src = ctx.createMediaStreamSource(stream)
    const wire = (node) => {
      node.port.onmessage = (e) => sendMicChunk(e.data)
      src.connect(node)
    }
    try {
      const url = URL.createObjectURL(new Blob([CAP_WORKLET], { type: 'application/javascript' }))
      await ctx.audioWorklet.addModule(url)
      URL.revokeObjectURL(url)
      wire(new AudioWorkletNode(ctx, 'resqra-cap'))
      return
    } catch { /* fall through to legacy tap */ }
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    const ratio = ctx.sampleRate / 16000
    let acc = 0
    const out = []
    proc.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0)
      for (let i = 0; i < ch.length; i++) {
        acc += 1
        if (acc >= ratio) {
          acc -= ratio
          const s = Math.max(-1, Math.min(1, ch[i]))
          out.push(s < 0 ? s * 0x8000 : s * 0x7FFF)
          if (out.length >= 960) {
            sendMicChunk(new Int16Array(out.splice(0, 960)))
          }
        }
      }
    }
    src.connect(proc)
    // Never wire the mic straight to ctx.destination — that echoes the room
    // through the speakers (feedback loop). Sink to silence instead.
    const sink = ctx.createGain()
    sink.gain.value = 0
    proc.connect(sink)
    sink.connect(ctx.destination)
  }

  // ---- Live duplex playback: gapless 24k PCM scheduling ----

  function ensurePlayCtx() {
    if (!playCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      playCtxRef.current = new Ctx({ sampleRate: 24000, latencyHint: 'interactive' })
      playNextRef.current = 0
    }
    const ctx = playCtxRef.current
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  function queueModelAudio(float32) {
    if (mutedRef.current) return // muted: follow captions, drop audio
    try {
      const ctx = ensurePlayCtx()
      const buf = ctx.createBuffer(1, float32.length, 24000)
      buf.copyToChannel(float32, 0)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      const t = Math.max(ctx.currentTime + 0.05, playNextRef.current || 0)
      src.start(t)
      playNextRef.current = t + buf.duration
      playSourcesRef.current.add(src)
      src.onended = () => playSourcesRef.current.delete(src)
      setListening(true)
    } catch { /* drop chunk */ }
  }

  function interruptPlayback() {
    // Server said `interrupted`: kill scheduled audio so the user wins.
    for (const src of playSourcesRef.current) {
      try { src.stop() } catch { /* noop */ }
    }
    playSourcesRef.current.clear()
    try {
      if (playCtxRef.current) playNextRef.current = playCtxRef.current.currentTime
    } catch { /* noop */ }
  }

  function b64ToFloat32(b64) {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const pcm = new Int16Array(bytes.buffer)
    const out = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] / 32768
    return out
  }

  function onLiveMessage(msg) {
    const t = msg.type
    if (t === 'ready') {
      setCaption('Live — speak naturally. Tap orb to end.')
      return
    }
    if (t === 'audio' && msg.data) {
      try {
        queueModelAudio(b64ToFloat32(msg.data))
      } catch { /* drop chunk */ }
      return
    }
    if (t === 'interrupted') {
      interruptPlayback()
      setCaption('Listening… (you cut in)')
      return
    }
    if (t === 'input_transcript' && msg.text) {
      inAccumRef.current += msg.text
      setCaption(`You: ${inAccumRef.current.trim()}`)
      // Workspace shortcuts still work hands-free — but fire once per turn,
      // not on every partial, and say what happened.
      try {
        const said = tryLocalIntent(inAccumRef.current)
        if (said && firedIntentRef.current !== said) {
          firedIntentRef.current = said
          toast.info('Voice shortcut', { description: said })
        }
      } catch { /* noop */ }
      return
    }
    if (t === 'output_transcript' && msg.text) {
      outAccumRef.current += msg.text
      const full = outAccumRef.current.trim()
      setLastReply(full)
      setCaption(full)
      return
    }
    if (t === 'turn_complete') {
      inAccumRef.current = ''
      outAccumRef.current = ''
      firedIntentRef.current = null
      return
    }
    if (t === 'warning' && msg.message) {
      toast.warning('Live voice', { description: msg.message })
      if (/ended/i.test(msg.message)) stopLive()
      return
    }
    if (t === 'error') {
      toast.error('Live voice failed', { description: msg.message || 'session refused' })
      stopLive()
    }
  }

  async function startLive() {
    if (!micReady()) {
      toast.error('Voice input unavailable', {
        description: window.isSecureContext
          ? 'This browser cannot record audio (no microphone found).'
          : 'Microphone needs a secure page — open this console via http://localhost:5173.',
      })
      return
    }
    // Second tap while connecting must not orphan the first socket+mic.
    if (liveRef.current || liveWsRef.current) return
    stopPlayback()
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    setCaption('Connecting live voice…')
    setOpen(true)
    let sid = null
    try {
      sid = await ensureSession()
    } catch (err) {
      toast.error('Live voice failed', { description: err.message })
      setCaption('')
      return
    }
    const token = getToken()
    if (!token) {
      toast.error('Live voice failed', { description: 'Sign in again first.' })
      setCaption('')
      return
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/^https?:\/\//, '')
    const host = apiBase || window.location.host
    const url = `${proto}//${host}/api/ops/assistant/live` +
      `?token=${encodeURIComponent(token)}&session_id=${encodeURIComponent(sid)}`
    let ws = null
    try {
      ws = new WebSocket(url)
    } catch {
      toast.error('Live voice failed', { description: 'Could not open socket.' })
      setCaption('')
      return
    }
    liveWsRef.current = ws
    inAccumRef.current = ''
    outAccumRef.current = ''
    ws.onopen = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Server may have refused while the mic prompt was open: never go
        // live on a dead socket, and never leak the fresh mic track.
        if (liveWsRef.current !== ws || ws.readyState !== WebSocket.OPEN) {
          stream.getTracks().forEach((t) => { try { t.stop() } catch { /* noop */ } })
          return
        }
        streamRef.current = stream
        await startCapture(stream)
        liveRef.current = true
        setLive(true)
        setListening(true)
        setCaption('Live — speak naturally. Tap orb to end.')
      } catch {
        stopLive()
        setCaption('Live failed — tap Go live to retry.')
        toast.error('Microphone blocked', { description: 'Allow mic access, then tap again.' })
      }
    }
    ws.onmessage = (e) => {
      try {
        onLiveMessage(JSON.parse(e.data))
      } catch { /* ignore */ }
    }
    ws.onerror = () => {
      if (liveRef.current || liveWsRef.current === ws) {
        toast.error('Live voice failed', { description: 'Socket error — retry.' })
      }
      stopLive()
    }
    ws.onclose = () => {
      if (liveWsRef.current === ws) stopLive()
    }
  }

  function stopLive() {
    const wasLive = liveRef.current
    liveRef.current = false
    setLive(false)
    setListening(false)
    try { liveWsRef.current?.close() } catch { /* noop */ }
    liveWsRef.current = null
    interruptPlayback()
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    speakingRef.current = false
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { /* noop */ }
    streamRef.current = null
    try { capCtxRef.current?.close()?.catch?.(() => {}) } catch { /* noop */ }
    capCtxRef.current = null
    inAccumRef.current = ''
    outAccumRef.current = ''
    firedIntentRef.current = null
    // Always reset the caption: a failed connect must never leave
    // 'Connecting live voice…' on screen forever.
    setCaption('')
  }

  // Single-shot push-to-talk (used when live mode is off).
  // Capped at 60 s: bounds the upload so big TLS posts stay reliable.
  const MAX_ONCE_S = 60
  function recordOnce() {
    if (liveRef.current) return
    if (!micReady()) {
      toast.error('Voice input unavailable', {
        description: window.isSecureContext
          ? 'This browser cannot record audio (no microphone found).'
          : 'Microphone needs a secure page — open this console via http://localhost:5173.',
      })
      return
    }
    if (listening) {
      try { recorderRef.current?.stop() } catch { /* noop */ }
      // If onstop never fires, don't leave the red glow stuck forever.
      setTimeout(() => {
        if (recorderRef.current) setListening(false)
      }, 1500)
      return
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const stopTracks = () => {
        try { stream.getTracks().forEach((t) => t.stop()) } catch { /* noop */ }
      }
      let rec = null
      try {
        rec = new MediaRecorder(stream)
      } catch {
        stopTracks()
        toast.error('Recording failed', { description: 'This browser cannot record audio.' })
        return
      }
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data)
      }
      rec.onerror = () => {
        stopTracks()
        recorderRef.current = null
        setListening(false)
        toast.error('Recording failed', { description: 'Microphone stream error — retry.' })
      }
      rec.onstop = () => {
        if (onceTimerRef.current) { clearTimeout(onceTimerRef.current); onceTimerRef.current = null }
        stopTracks()
        recorderRef.current = null
        setListening(false)
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        if (blob.size) sendVoice(blob)
        else toast.error('Empty recording', { description: 'No audio captured — check the mic.' })
      }
      recorderRef.current = rec
      try {
        rec.start(250)
      } catch {
        stopTracks()
        recorderRef.current = null
        toast.error('Recording failed', { description: 'Could not start the microphone.' })
        return
      }
      setListening(true)
      setCaption('Listening… tap again to stop.')
      try {
        onceTimerRef.current = setTimeout(() => {
          onceTimerRef.current = null
          try {
            if (recorderRef.current === rec && rec.state === 'recording') {
              rec.stop()
              toast.info('Capped at 60 s', { description: 'Long notes are split automatically.' })
            }
          } catch { /* noop */ }
        }, MAX_ONCE_S * 1000)
      } catch { /* noop */ }
    }).catch(() => toast.error('Microphone blocked', { description: 'Allow mic access, then tap again.' }))
  }

  const pushTalking = listening && !live
  const glow = pushTalking
    ? 'bg-red-500 shadow-[0_0_28px_rgba(239,68,68,0.65)]'
    : live
      ? 'bg-emerald-600 shadow-[0_0_28px_rgba(16,185,129,0.6)] hover:bg-emerald-500'
      : thinking
        ? 'bg-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.6)] animate-pulse'
        : 'bg-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.45)] hover:bg-slate-700'

  return (
    <div className="fixed bottom-24 right-5 z-[1200] flex flex-col items-end gap-2 font-sans">
      {open && (
        <div className="w-72 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700">
              <Sparkles className="size-3.5" /> ResQra voice console
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  mutedRef.current = !mutedRef.current
                  setMuted(mutedRef.current)
                  if (mutedRef.current) interruptPlayback()
                }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={muted ? 'Unmute replies' : 'Mute replies'}
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto p-3 text-xs leading-relaxed text-slate-700">
            {lastReply ? (
              <p className="whitespace-pre-wrap">{lastReply}</p>
            ) : (
              <p className="text-slate-400">
                Tap the orb for instant hands-free voice, or ask one question
                below. Replies are spoken aloud unless muted.
              </p>
            )}
            {caption && caption !== lastReply && (
              <p className="mt-2 border-t border-slate-100 pt-2 font-mono text-[11px] text-slate-400">
                {caption}
              </p>
            )}
            {thinking && <p className="mt-1 font-mono text-[11px] text-amber-600">Thinking…</p>}
            {live && (
              <p className="mt-1 font-mono text-[11px] font-bold text-emerald-600">
                ● LIVE — hands-free, talk naturally
              </p>
            )}
          </div>
          {live ? (
            <button
              onClick={stopLive}
              className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              <MicOff className="size-3.5" /> End live session
            </button>
          ) : (
            <button
              onClick={startLive}
              className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              <Mic className="size-3.5" /> Go live — hands-free · fastest
            </button>
          )}
          {!live && (
            <button
              onClick={recordOnce}
              className="mx-3 mb-3 -mt-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              {listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
              {listening ? 'Stop & send' : 'Tap & speak once — slower'}
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => (live ? stopLive() : startLive())}
        aria-label={live ? 'End live voice session' : 'Start live voice session'}
        className={`grid size-14 place-items-center rounded-full text-white transition active:scale-95 ${glow}`}
      >
        {pushTalking ? <MicOff className="size-6" /> : thinking ? <Sparkles className="size-6 animate-pulse" /> : <Mic className="size-6" />}
      </button>
      {(live || pushTalking || thinking) && (
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold shadow ${
          live ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : pushTalking ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {live ? '● LIVE' : pushTalking ? '● REC' : '○ THINKING'}
        </span>
      )}
    </div>
  )
}
