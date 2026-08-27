import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  MapPin,
  Maximize2,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Ship,
  Sparkles,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import { Circle, CircleMarker, LayerGroup, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { toast } from 'sonner'
import { api } from '../../api.js'
import { Button } from '../../components/ui/button.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'

function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

function FlyToSelected({ selectedEvent }) {
  const map = useMap()
  useEffect(() => {
    if (selectedEvent?.lat && selectedEvent?.lng) {
      map.flyTo([selectedEvent.lat, selectedEvent.lng], 7, { animate: true, duration: 1.2 })
    }
  }, [selectedEvent, map])
  return null
}

export default function GlobalDisasterMonitorView({ onFocusTactical }) {
  const [events, setEvents] = useState([])
  const [liveIntel, setLiveIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [timeFilter, setTimeFilter] = useState('7d') // '1h' | '6h' | '24h' | '7d' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [dockTab, setDockTab] = useState('wire') // 'wire' | 'brief' | 'gauge'
  const [dockOpen, setDockOpen] = useState(true)
  const [utcTime, setUtcTime] = useState('')

  // Layer Visibility Toggles
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    cyclone: true,
    earthquake: true,
    wildfire: true,
    regional: true,
  })

  function toggleLayer(key) {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Live UTC Clock
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'))
    }
    updateClock()
    const id = setInterval(updateClock, 1000)
    return () => clearInterval(id)
  }, [])

  async function loadData() {
    try {
      const [eventsRes, intelRes] = await Promise.all([
        api.globalDisasters(),
        api.disasterLiveIntel(),
      ])
      setEvents(eventsRes.events || [])
      setLiveIntel(intelRes)
    } catch (err) {
      console.error('Failed to load global disaster events', err)
      toast.error('Global Feeds Offline', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000) // 30s poll
    return () => clearInterval(id)
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (!activeLayers[ev.category] && activeLayers[ev.category] !== undefined) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          ev.title?.toLowerCase().includes(q) ||
          ev.category?.toLowerCase().includes(q) ||
          ev.source?.toLowerCase().includes(q) ||
          ev.impact_summary?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [events, activeLayers, searchQuery])

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts = { flood: 0, cyclone: 0, earthquake: 0, wildfire: 0 }
    events.forEach((ev) => {
      if (counts[ev.category] !== undefined) counts[ev.category]++
      else counts.flood++
    })
    return counts
  }, [events])

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[620px] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#09090b] font-sans text-zinc-100 shadow-2xl relative select-none">
      
      {/* 1. TOP GLOBAL SITUATION HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-black px-4 py-2 text-xs">
        {/* Left Title & Threat Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded bg-white text-black font-mono font-black text-xs">
              <Globe className="size-3.5" />
            </span>
            <span className="font-mono text-xs font-black tracking-wider text-white">
              GLOBAL SITUATION ROOM
            </span>
          </div>

          <Badge variant="default" className="bg-white text-black font-bold gap-1">
            <span className="size-1.5 rounded-full bg-black animate-pulse" />
            {liveIntel?.defcon_status || 'DEFCON 1: ACTIVE MONSOON SURGE'}
          </Badge>

          <span className="hidden md:inline-flex font-mono text-[10px] text-zinc-500">
            {events.length} HAZARDS TRACKED VIA NASA & USGS
          </span>
        </div>

        {/* Center Time Range Filters */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span className="text-zinc-500 uppercase font-bold mr-1">WINDOW:</span>
          {['1h', '6h', '24h', '7d', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`rounded px-2 py-0.5 font-bold uppercase transition ${
                timeFilter === t
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right Live UTC Clock & Refresh */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-zinc-500" />
            <span className="text-zinc-200">{utcTime || 'UTC 14:20:00'}</span>
          </div>

          <button
            onClick={loadData}
            className="grid size-7 place-items-center rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-600 transition"
            title="Refresh open disaster feeds"
          >
            <RefreshCw className={`size-3 ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MAP CANVAS WITH FLOATING LAYER HUD */}
      <div className="relative flex-1 min-h-0">
        
        {/* Floating Left Layer Control HUD (World Monitor Style) */}
        <div className="absolute left-3 top-3 z-[1000] w-64 rounded-xl border border-zinc-800 bg-black/90 p-3 shadow-2xl backdrop-blur-md font-mono text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="size-3 text-zinc-500" /> DISASTER LAYERS
            </span>
            <span className="text-[10px] text-zinc-500">{filteredEvents.length} Active</span>
          </div>

          {/* Search in feeds */}
          <div className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px]">
            <Search className="size-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search hazards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder:text-zinc-600 focus:outline-none w-full text-[10px]"
            />
          </div>

          {/* Layer Toggles */}
          <div className="space-y-1 text-[11px]">
            <label className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-zinc-900 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-200">
                <input
                  type="checkbox"
                  checked={activeLayers.flood}
                  onChange={() => toggleLayer('flood')}
                  className="rounded border-zinc-700 bg-black text-white focus:ring-0"
                />
                🌊 Floods & Inundations
              </span>
              <span className="font-bold text-white text-[10px]">{categoryCounts.flood}</span>
            </label>

            <label className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-zinc-900 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-200">
                <input
                  type="checkbox"
                  checked={activeLayers.cyclone}
                  onChange={() => toggleLayer('cyclone')}
                  className="rounded border-zinc-700 bg-black text-white focus:ring-0"
                />
                🌀 Cyclones & Storms
              </span>
              <span className="font-bold text-white text-[10px]">{categoryCounts.cyclone}</span>
            </label>

            <label className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-zinc-900 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-200">
                <input
                  type="checkbox"
                  checked={activeLayers.earthquake}
                  onChange={() => toggleLayer('earthquake')}
                  className="rounded border-zinc-700 bg-black text-white focus:ring-0"
                />
                🌋 Earthquakes (M≥4.5)
              </span>
              <span className="font-bold text-white text-[10px]">{categoryCounts.earthquake}</span>
            </label>

            <label className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-zinc-900 cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-200">
                <input
                  type="checkbox"
                  checked={activeLayers.wildfire}
                  onChange={() => toggleLayer('wildfire')}
                  className="rounded border-zinc-700 bg-black text-white focus:ring-0"
                />
                🌲 Wildfire Satellite Detections
              </span>
              <span className="font-bold text-white text-[10px]">{categoryCounts.wildfire}</span>
            </label>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <MapContainer
          center={[24.0, 84.0]} // Centered on South Asia / Indian Subcontinent macro basin
          zoom={4}
          zoomControl={false}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          preferCanvas={true}
          style={{ height: '100%', width: '100%', background: '#09090b' }}
        >
          <AutoResize />
          <FlyToSelected selectedEvent={selectedEvent} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-tiles"
            maxZoom={18}
          />

          {/* Global Disaster Markers */}
          <LayerGroup>
            {filteredEvents.map((ev) => {
              const isCrit = ev.severity === 'CRITICAL'
              const isEq = ev.category === 'earthquake'
              const isFlood = ev.category === 'flood'
              const isCyclone = ev.category === 'cyclone'

              return (
                <LayerGroup key={ev.id}>
                  {/* Danger Impact Circles */}
                  {isCrit && (
                    <Circle
                      center={[ev.lat, ev.lng]}
                      radius={isFlood ? 80000 : 120000} // 80km - 120km global impact circle
                      pathOptions={{
                        color: isFlood ? '#ffffff' : '#a1a1aa',
                        fillColor: isFlood ? '#ffffff' : '#71717a',
                        fillOpacity: 0.06,
                        weight: 1,
                        dashArray: '4, 4',
                      }}
                    />
                  )}

                  <CircleMarker
                    center={[ev.lat, ev.lng]}
                    radius={isCrit ? 10 : isEq ? 7 : 6}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: isFlood ? '#ffffff' : isCyclone ? '#a1a1aa' : '#52525b',
                      fillOpacity: 0.95,
                      weight: isCrit ? 2 : 1,
                    }}
                    eventHandlers={{
                      click: () => setSelectedEvent(ev),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1.5 font-sans min-w-[220px]">
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1">
                          <span className="font-mono text-xs font-bold text-white uppercase">{ev.category}</span>
                          <span className="rounded bg-white px-1.5 py-0.2 font-mono text-[9px] font-black text-black">
                            {ev.severity}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-white leading-snug">{ev.title}</h4>
                        <p className="text-[11px] leading-relaxed text-zinc-300">{ev.impact_summary}</p>
                        
                        <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>Source: {ev.source}</span>
                          {ev.magnitude && <b className="text-white">{ev.magnitude}</b>}
                        </div>

                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 flex items-center gap-1 font-mono text-[10px] text-white hover:underline"
                          >
                            <ExternalLink className="size-3" /> View Official Advisory
                          </a>
                        )}

                        {onFocusTactical && isFlood && (
                          <Button
                            size="sm"
                            onClick={() => onFocusTactical(ev)}
                            className="mt-2 w-full font-mono text-[10px] font-bold h-6"
                          >
                            ⚡ Zoom to Local Tactical Triage
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </LayerGroup>
              )
            })}
          </LayerGroup>
        </MapContainer>
      </div>

      {/* 3. BOTTOM SITUATION ROOM DOCK (WORLD MONITOR STYLE) */}
      <div className="border-t border-zinc-800 bg-black font-sans text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-1.5 bg-[#09090b]">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <button
              onClick={() => setDockTab('wire')}
              className={`rounded px-2.5 py-1 font-bold uppercase transition flex items-center gap-1.5 ${
                dockTab === 'wire' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="size-3" /> LIVE RELIEF WIRE
            </button>
            <button
              onClick={() => setDockTab('brief')}
              className={`rounded px-2.5 py-1 font-bold uppercase transition flex items-center gap-1.5 ${
                dockTab === 'brief' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="size-3" /> AI SITUATION BRIEF
            </button>
            <button
              onClick={() => setDockTab('gauge')}
              className={`rounded px-2.5 py-1 font-bold uppercase transition flex items-center gap-1.5 ${
                dockTab === 'gauge' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="size-3" /> BASIN GLOFAS RADAR
            </button>
          </div>

          <button
            onClick={() => setDockOpen(!dockOpen)}
            className="text-zinc-400 hover:text-white font-mono text-[10px] flex items-center gap-1"
          >
            {dockOpen ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            {dockOpen ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>

        {dockOpen && (
          <div className="h-36 overflow-y-auto p-3 bg-black font-mono text-xs">
            {/* PANE 1: LIVE RELIEF WIRE */}
            {dockTab === 'wire' && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {liveIntel?.news_wire?.map((item) => (
                  <div key={item.id} className="rounded-lg border border-zinc-800 bg-[#09090b] p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-white">{item.agency}</span>
                      <span className="text-zinc-500">{item.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300 line-clamp-2">{item.headline}</p>
                    <span className="inline-block font-mono text-[9px] text-zinc-400 border border-zinc-800 rounded px-1">
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* PANE 2: AI SITUATION BRIEF */}
            {dockTab === 'brief' && (
              <div className="space-y-1.5 max-w-4xl text-zinc-300">
                <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Bot className="size-3.5" /> ResQra Autonomous Supervisor Briefing:
                </p>
                <ul className="space-y-1 text-[11px] text-zinc-300">
                  {liveIntel?.ai_situation_brief?.map((point, i) => (
                    <li key={i} className="leading-relaxed">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PANE 3: BASIN DISCHARGE GAUGE */}
            {dockTab === 'gauge' && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 bg-[#09090b] p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase">Bagmati River Gauge (Balkhu)</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">4.85 m</div>
                  <span className="text-[10px] text-white">RED ALERT: Overflow +1.85m</span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#09090b] p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase">Kosi Barrage Discharge</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">380,000 cfs</div>
                  <span className="text-[10px] text-zinc-400">56 Gates Operational</span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#09090b] p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase">GloFAS 7-Day Trend</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">Receding Peak</div>
                  <span className="text-[10px] text-zinc-400">Precipitation band easing</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
