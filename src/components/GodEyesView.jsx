// God Eyes — FULL God's Eye View embed (coordinator tab, Nepal-locked boot).
//
// This tab embeds the complete upstream globe:
//   https://github.com/bilawalsidhu/gods-eye-view (MIT)
// vendored at third_party/gods-eye-view and served on VITE_GEV_URL
// (default http://127.0.0.1:4173 — `npm run dev` inside third_party/gods-eye-view).
//
// BOOT: iframe loads `?resqra=1`, so the globe flies to the RAUTAHAT ops
// sector (not Austin) and auto-enables the ResQra Ops layer.
//
// BRIDGES (postMessage, no CORS involved):
//   globe -> parent : { source:'resqra-gev', type:'resqra:ready' } (ops layer)
//   globe -> parent : { source:'resqra-gev', type:'resqra:bridge-ready' } (embed)
//   parent -> globe : { source:'resqra-parent', type:'resqra:world-state', data }
//   parent -> globe : { source:'resqra-parent', type:'resqra:get-cameras' }
//   globe -> parent : { source:'resqra-gev', type:'resqra:cameras', cameras }
//   parent -> globe : { source:'resqra-parent', type:'resqra:focus-camera', id }
//   globe -> parent : { source:'resqra-gev', type:'resqra:focus-result', ... }
//
// The ALL CAMERAS drawer lists the globe's whole CCTV catalog (searchable,
// one click to fly) so nobody has to cycle the cramped in-globe panel.
//
// If the globe server is down, the tab shows a full-tab diagnose + start
// panel (globe-only — no 2D map) with a RETRY button and a direct link.

import { useCallback, useEffect, useRef, useState } from 'react'

// NOTE: 127.0.0.1, not "localhost", on purpose. On this machine bare
// `npm run dev` binds IPv6 ::1 only, and browsers resolve "localhost"
// inconsistently per stack — probe passed on ::1 while the frame died on
// 127.0.0.1 ("refused to connect"). An explicit IPv4 address makes the
// health probe and the iframe test the SAME endpoint.
const GEV_URL = (
  import.meta.env.VITE_GEV_URL || 'http://127.0.0.1:4173'
).replace(/\/$/, '')
const RESQRA_API =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function gevSrc() {
  const params = new URLSearchParams({
    resqra: '1',
    resqraApi: RESQRA_API,
  })
  return `${GEV_URL}/?${params.toString()}`
}

async function globeUp() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    // opaque response = server reachable (no CORS needed for up/down check)
    await fetch(`${GEV_URL}/`, { mode: 'no-cors', signal: ctrl.signal })
    clearTimeout(timer)
    return true
  } catch {
    return false
  }
}

export default function GodEyesView(props) {
  const {
    incidents = [],
    teams = [],
    shelters = [],
    residents = [],
  } = props
  const [live, setLive] = useState(false)
  const [checking, setChecking] = useState(true)
  const [globeReady, setGlobeReady] = useState(false)
  const [frameBlocked, setFrameBlocked] = useState(false)
  const [src, setSrc] = useState(gevSrc)
  const [cameras, setCameras] = useState([])
  const [camerasOpen, setCamerasOpen] = useState(false)
  const [cameraQuery, setCameraQuery] = useState('')
  const [activeCameraId, setActiveCameraId] = useState(null)
  const [focusNote, setFocusNote] = useState('')
  const frameRef = useRef(null)
  const pushTimer = useRef(null)
  const handshakeTimer = useRef(null)
  const handshakeFails = useRef(0)

  const showGlobe = live

  // Health polling — auto-upgrades to LIVE the moment the globe appears.
  useEffect(() => {
    let cancelled = false
    async function check() {
      const up = await globeUp()
      if (!cancelled) {
        setLive(up)
        setChecking(false)
      }
    }
    check()
    const id = setInterval(check, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const postToGlobe = useCallback((message) => {
    try {
      frameRef.current?.contentWindow?.postMessage(
        { source: 'resqra-parent', ...message },
        '*'
      )
      return true
    } catch {
      return false
    }
  }, [])

  const pushWorldState = useCallback(() => {
    postToGlobe({ type: 'resqra:world-state', data: { incidents, teams, shelters, residents } })
  }, [postToGlobe, incidents, teams, shelters, residents])

  const requestCameras = useCallback(() => {
    postToGlobe({ type: 'resqra:get-cameras' })
  }, [postToGlobe])

  // Globe messages: ops handshake, bridge handshake, camera catalog, focus results.
  useEffect(() => {
    function onMessage(event) {
      const msg = event?.data
      if (!msg || msg.source !== 'resqra-gev') return
      if (msg.type === 'resqra:ready') {
        setGlobeReady(true)
        pushWorldState()
      } else if (msg.type === 'resqra:bridge-ready') {
        setGlobeReady(true)
        pushWorldState()
        requestCameras()
      } else if (msg.type === 'resqra:cameras') {
        setCameras(Array.isArray(msg.cameras) ? msg.cameras : [])
      } else if (msg.type === 'resqra:focus-result') {
        if (msg.ok) {
          setActiveCameraId(msg.id)
          setFocusNote('')
        } else {
          setFocusNote(msg.detail || 'Camera unavailable')
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [pushWorldState, requestCameras])

  useEffect(() => {
    if (!globeReady) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(pushWorldState, 600)
    return () => clearTimeout(pushTimer.current)
  }, [pushWorldState, globeReady])

  // Watchdog: probe can pass while the frame itself refuses to connect
  // (e.g. IPv6/IPv4 localhost mismatch). If no handshake in 25s, re-probe:
  // server down -> offline panel; server up -> reload frame once; twice
  // bitten -> stop looping with a "frame blocked" note.
  useEffect(() => {
    clearTimeout(handshakeTimer.current)
    if (!showGlobe || globeReady) {
      if (globeReady) {
        handshakeFails.current = 0
        setFrameBlocked(false)
      }
      return
    }
    handshakeTimer.current = setTimeout(async () => {
      handshakeFails.current += 1
      if (handshakeFails.current >= 2) {
        setFrameBlocked(true)
        setLive(false)
        setChecking(false)
        return
      }
      const up = await globeUp()
      if (!up) {
        setLive(false)
      } else {
        setSrc(`${gevSrc()}#retry=${Date.now()}`)
      }
      setChecking(false)
    }, 25000)
    return () => clearTimeout(handshakeTimer.current)
  }, [showGlobe, globeReady, src])

  function frameFailed() {
    // The frame itself reports a navigation error — don't wait for the probe.
    setLive(false)
    setChecking(false)
  }

  function focusCamera(id) {
    setActiveCameraId(null)
    setFocusNote('Focusing…')
    postToGlobe({ type: 'resqra:focus-camera', id })
  }

  const query = cameraQuery.trim().toLowerCase()
  const visibleCameras = query
    ? cameras.filter((cam) =>
        `${cam.name || ''} ${cam.city || ''} ${cam.provider || ''} ${cam.id || ''}`
          .toLowerCase()
          .includes(query)
      )
    : cameras

  return (
    <div className="flex flex-col">
      {/* ── Full globe, chromeless — fills the tab ───────────────────────── */}
      {showGlobe && (
        <div className="relative -m-3 overflow-hidden bg-black">
          <iframe
            ref={frameRef}
            key={src}
            src={src}
            title="God's Eye View — full globe with ResQra ops"
            className="block h-[calc(100vh-56px)] min-h-[560px] w-full border-0"
            allow="geolocation; microphone; camera; autoplay; fullscreen"
            onError={frameFailed}
          />

          {/* ── All-cameras browser: one tab, search, click-to-fly ──────── */}
          <button
            onClick={() => {
              setCamerasOpen((open) => !open)
              if (!camerasOpen) requestCameras()
            }}
            className="absolute left-3 top-3 z-[1000] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 font-mono text-[11px] font-black tracking-wider text-white shadow-2xl backdrop-blur transition hover:bg-slate-800"
          >
            {camerasOpen ? '✕ CLOSE' : `📷 CAMERAS${cameras.length ? ` (${cameras.length})` : ''}`}
          </button>

          {camerasOpen && (
            <div className="absolute bottom-3 left-3 top-14 z-[1000] flex w-[320px] max-w-[85vw] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur">
              <div className="border-b border-slate-800 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-300">
                    All cameras · {visibleCameras.length}/{cameras.length}
                  </span>
                  <button
                    onClick={requestCameras}
                    className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 transition hover:bg-slate-800"
                  >
                    ↻
                  </button>
                </div>
                <input
                  value={cameraQuery}
                  onChange={(e) => setCameraQuery(e.target.value)}
                  placeholder="Search name / city / id…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                {focusNote && (
                  <p className="mt-1.5 font-mono text-[10px] text-amber-300">{focusNote}</p>
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {visibleCameras.length === 0 && (
                  <p className="px-2 py-6 text-center font-mono text-[11px] text-slate-500">
                    {cameras.length === 0
                      ? 'No cameras in the catalog yet — add WINDY_API_KEY to the globe env and restart it.'
                      : 'No cameras match.'}
                  </p>
                )}
                {visibleCameras.map((cam) => {
                  const active = cam.id === activeCameraId
                  return (
                    <button
                      key={cam.id}
                      onClick={() => focusCamera(cam.id)}
                      className={`block w-full rounded-lg border px-2.5 py-2 text-left transition ${
                        active
                          ? 'border-emerald-400 bg-emerald-400/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[11px] font-bold text-white">
                          {active ? '◉ ' : '○ '}{cam.name || cam.id}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                        {[cam.city, cam.provider].filter(Boolean).join(' · ') || cam.id}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Offline: globe-only tab, no 2D map. Diagnose + start. ──────── */}
      {!showGlobe && (
        <div className="grid min-h-[480px] flex-1 place-items-center rounded-xl border border-slate-900 bg-slate-950 px-6 py-16 text-center shadow-2xl">
          <div className="max-w-lg space-y-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-2xl font-black text-slate-900">
              👁
            </div>
            <h2 className="font-mono text-sm font-black tracking-widest text-white">
              {frameBlocked ? 'GLOBE REACHABLE — FRAME BLOCKED' : "GLOBE ISN'T RUNNING"}
            </h2>
            {checking ? (
              <p className="font-mono text-xs text-slate-400">Probing {GEV_URL}…</p>
            ) : frameBlocked ? (
              <div className="space-y-3 font-mono text-xs leading-relaxed text-slate-400">
                <p>
                  The server answers, but this browser refuses the embed. Open it
                  directly — full globe, same Nepal boot, same ResQra layer:
                </p>
                <a
                  href={gevSrc()}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all rounded-lg border border-emerald-400/40 bg-black/60 px-3 py-2 font-bold text-emerald-300 hover:bg-black"
                >
                  {gevSrc()}
                </a>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs leading-relaxed text-slate-400">
                <p>The full 3D globe isn't reachable at {GEV_URL}. Start it:</p>
                <code className="block rounded-lg border border-slate-700 bg-black/60 px-3 py-2 text-left font-bold text-emerald-300">
                  cd third_party/gods-eye-view<br />
                  npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
                </code>
                <p>…or double-click <b>third_party/start-gev-dev.bat</b>.</p>
              </div>
            )}
            {!checking && (
              <button
                onClick={async () => {
                  setChecking(true)
                  setFrameBlocked(false)
                  handshakeFails.current = 0
                  setLive(await globeUp())
                  setChecking(false)
                }}
                className="rounded-lg bg-white px-4 py-2 font-mono text-xs font-black text-slate-900 transition hover:bg-slate-200"
              >
                ↻ RETRY GLOBE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
