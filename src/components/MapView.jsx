import React, { Component, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  Circle,
  CircleMarker,
  LayerGroup,
  MapContainer,
  Polygon,
  Popup,
  Polyline,
  Rectangle,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  WMSTileLayer,
  ZoomControl,
} from 'react-leaflet'
import HeatmapLayer from './HeatmapLayer.jsx'
import RoadLayer from './RoadLayer.jsx'
import LayerToggle from './LayerToggle.jsx'

export const RAUTAHAT_CENTER = [26.7640, 85.2780]

// NASA GIBS (Worldview backend) — display-only satellite imagery for flood
// context. Daily true-color, ~day-old; monsoon cloud cover often hides the
// ground, so this is ADVISORY ONLY and never feeds world_sync or dispatch.
const GIBS_WMS_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?'
const GIBS_LAYER = 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
// Swap to 'MODIS_Terra_CorrectedReflectance_Bands721' for false-color
// (flood/water contrast) under clear skies.
const GIBS_ATTRIBUTION =
  'Imagery © NASA GIBS/Worldview · advisory, ~daily, not ground truth'
function gibsDate() {
  // Yesterday UTC — today's pass is usually not yet published.
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

// Error Boundary to prevent any Leaflet internal error from crashing the entire app
export class MapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('MapView ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const msg = String(this.state.error?.message || this.state.error || 'unknown render error')
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-6 text-center text-slate-600 font-mono text-xs space-y-3">
          <p className="text-slate-900 font-bold">Map Rendering Recovered</p>
          <p className="text-slate-500 text-[11px] max-w-sm">
            The geospatial canvas encountered an unexpected layer format.
          </p>
          <p className="max-w-md rounded bg-white px-2 py-1 text-[10px] text-red-700 border border-red-200 break-all">
            {msg}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-900 hover:bg-zinc-200 transition"
          >
            Reload War Room Canvas
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Automatically recalculates dimensions when container resizes or tab switches
function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      try { map.invalidateSize() } catch { /* noop */ }
    }) : null
    ro?.observe(el)
    const timer = setTimeout(() => {
      try { map.invalidateSize() } catch { /* noop */ }
    }, 150)
    const onVis = () => { if (!document.hidden) { try { map.invalidateSize() } catch { /* noop */ } } }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
      ro?.disconnect()
    }
  }, [map])
  return null
}

// Center controller that only centers when areaCenter changes, without fighting manual pinch/zoom
function AreaCenterController({ center }) {
  const map = useMap()
  const lastCenter = useRef(null)

  useEffect(() => {
    if (!center) return
    const key = `${center[0].toFixed(3)},${center[1].toFixed(3)}`
    if (lastCenter.current !== key) {
      lastCenter.current = key
      map.flyTo(center, 12, { animate: true, duration: 0.8 })
    }
  }, [center, map])

  return null
}

// Distinct, Vibrant Colors for Each Emergency Category
function priorityColor(score) {
  if (score >= 8) {
    // Critical: Vibrant Crimson Red
    return { color: '#b91c1c', fillColor: '#ef4444', weight: 2.5 }
  }
  if (score >= 4) {
    // Elevated: Amber Orange
    return { color: '#d97706', fillColor: '#f59e0b', weight: 2 }
  }
  // Low: Golden Yellow
  return { color: '#ca8a04', fillColor: '#eab308', weight: 1.5 }
}

function teamColor(status) {
  if (status === 'ON_MISSION') {
    // On Mission: Vibrant Indigo/Purple
    return { color: '#7e22ce', fillColor: '#a855f7', weight: 2.5 }
  }
  if (status === 'RETURNING') {
    // Returning: Sky Blue
    return { color: '#0284c7', fillColor: '#38bdf8', weight: 2 }
  }
  if (status === 'OFFLINE') {
    // Offline: Slate
    return { color: '#52525b', fillColor: '#27272a', weight: 1.5 }
  }
  // Available: Electric Royal Blue
  return { color: '#1d4ed8', fillColor: '#3b82f6', weight: 2.5 }
}

function riskStyle(level) {
  const key = String(level || '').toUpperCase()
  if (key === 'SAFE') return { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08 }
  if (key === 'WATCH' || key === 'RISING') return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.12 }
  return { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15 }
}

function readableLocation(item, fallback = 'Location available') {
  const label = item?.location_text || item?.location?.label || item?.device_location?.label || ''
  if (!label || label.toLowerCase() === 'not found') return fallback
  return label
}

// Backend rows occasionally carry null/partial coords — filter before
// Leaflet ever sees them (NaN lat/lng unmounts the whole map).
function okLatLng(loc) {
  return !!loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))
}

function haversineKm(aLat, aLng, bLat, bLng) {  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Thin direct connectors from the selected SOS to its nearest shelter
// and nearest team — orientation lines under the routed best path.
function DirectLines({ incidents = [], shelters = [], teams = [], selectedIncidentId }) {
  const inc = incidents.find((i) => i.id === selectedIncidentId)
  const loc = inc?.location
  const ok = (v) => v != null && Number.isFinite(Number(v))
  if (!inc || !ok(loc?.lat) || !ok(loc?.lng)) return null

  let nearShelter = null
  let nearShelterD = Infinity
  for (const s of shelters) {
    const sl = s.location
    if (!ok(sl?.lat) || !ok(sl?.lng)) continue
    const d = haversineKm(loc.lat, loc.lng, sl.lat, sl.lng)
    if (d < nearShelterD) {
      nearShelterD = d
      nearShelter = s
    }
  }

  let nearTeam = null
  let nearTeamD = Infinity
  for (const t of teams) {
    const tl = t.location
    if (!ok(tl?.lat) || !ok(tl?.lng)) continue
    const d = haversineKm(loc.lat, loc.lng, tl.lat, tl.lng)
    if (d < nearTeamD) {
      nearTeamD = d
      nearTeam = t
    }
  }

  return (
    <LayerGroup>
      {nearShelter && (
          <Polyline
            key={`direct-shelter-${inc.id}`}
            positions={[[loc.lat, loc.lng], [nearShelter.location.lat, nearShelter.location.lng]]}
            pathOptions={{ color: '#059669', weight: 2.5, opacity: 0.8, dashArray: '2, 7' }}
        >
          <Tooltip direction="top" sticky opacity={0.95}>
            <span className="font-mono text-[11px] font-bold text-emerald-800">
              ⛺ Nearest shelter: {nearShelter.name} ({nearShelterD.toFixed(1)} km, straight line — not a road route)
            </span>
          </Tooltip>
        </Polyline>
      )}
      {nearTeam && (
          <Polyline
            key={`direct-team-${inc.id}`}
            positions={[[loc.lat, loc.lng], [nearTeam.location.lat, nearTeam.location.lng]]}
            pathOptions={{ color: '#64748b', weight: 2.5, opacity: 0.8, dashArray: '2, 7' }}
        >
          <Tooltip direction="top" sticky opacity={0.95}>
            <span className="font-mono text-[11px] font-bold text-slate-700">
              📍 Nearest team: {nearTeam.name} ({nearTeamD.toFixed(1)} km, straight line — not a road route)
            </span>
          </Tooltip>
        </Polyline>
      )}
    </LayerGroup>
  )
}

// Two-click region marking: in regionMode, first click anchors a corner,
// second click completes the bbox and reports it upward.
function RegionPicker({ active, onDone }) {
  const [corner, setCorner] = useState(null)
  useMapEvents({
    click(e) {
      if (!active) return
      const pt = [e.latlng.lat, e.latlng.lng]
      if (!corner) {
        setCorner(pt)
      } else {
        const sw = [Math.min(corner[0], pt[0]), Math.min(corner[1], pt[1])]
        const ne = [Math.max(corner[0], pt[0]), Math.max(corner[1], pt[1])]
        setCorner(null)
        onDone && onDone([sw, ne])
      }
    },
  })
  if (!active || !corner) return null
  return <CircleMarker center={corner} radius={6} pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 1 }} />
}

export default function MapView(props) {
  return (
    <MapErrorBoundary>
      <MapViewInner {...props} />
    </MapErrorBoundary>
  )
}

function MapViewInner({
  shelters = [],
  incidents = [],
  teams = [],
  residents = [],
  areas = [],
  sensorEvents = [],
  myIncident = null,
  height = '320px',
  onIncidentSelect = null,
  darkTiles = false,
  areaCenter = RAUTAHAT_CENTER,
  areaBounds = null,
  visibleLayers = null,
  onLayerToggle = null,
  selectedIncidentId = null,
  routeLine = null,
  routeDetail = null,
  routeLoading = false,
  regionMode = false,
  onRegionSelect = null,
  markedRegion = null,
}) {
  const [showLegend, setShowLegend] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const layers = visibleLayers || {
    heatmap: true,
    roads: true,
    incidents: true,
    teams: true,
    shelters: true,
    residents: true,
    areas: true,
    satellite: false,
  }

  // Safe bounds for road layer
  const roadBounds = areaBounds || null
  const counts = {
    incidents: incidents.length,
    teams: teams.length,
    shelters: shelters.length,
    residents: residents.length,
    areas: areas.length,
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        darkTiles ? 'border-0 bg-slate-100' : 'rounded-xl border border-slate-200'
      }`}
      style={{ height }}
    >
      {onLayerToggle && (
        <LayerToggle visible={layers} onToggle={onLayerToggle} counts={counts} />
      )}

      {/* Collapsible legend — comfortable by default, rich on demand */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="rounded-lg border border-slate-200 bg-slate-100/95 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-xl backdrop-blur transition hover:text-slate-900"
        >
          {showLegend ? 'Hide legend' : 'Legend'}
        </button>
        {showLegend && (
          <div className="pointer-events-none mt-1.5 flex max-w-xl flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-mono shadow-xl backdrop-blur">
        <span className="text-[10px] uppercase font-bold text-slate-500">LEGEND:</span>
        <span className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-red-800"><span className="size-2 rounded-full bg-red-500 animate-pulse" /> Critical ≥8</span>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800"><span className="size-2 rounded-full bg-amber-500" /> Elevated 4-7</span>
        <span className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-yellow-800"><span className="size-2 rounded-full bg-yellow-400" /> Low 0-3</span>
        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-blue-800"><span className="size-2 rounded-full bg-blue-500" /> Team free</span>
        <span className="flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-purple-800"><span className="size-2 rounded-full bg-purple-500" /> On mission</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800"><span className="size-2 rounded-sm bg-emerald-500" /> Shelter + safe zone</span>
        <span className="flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-cyan-800"><span className="size-2 rounded-full bg-cyan-400" /> Citizen</span>
        <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-300 px-2 py-0.5 text-green-900 font-bold"><span className="inline-block h-[5px] w-4 rounded-full bg-green-600 ring-2 ring-white shadow" /> Best route</span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800"><span className="inline-block h-0 w-4 border-t-2 border-dashed border-emerald-600" /> Shelter · direct</span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-600"><span className="inline-block h-0 w-4 border-t-2 border-dashed border-slate-500" /> Team · direct</span>
        {layers.satellite && (
          <span className="flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-sky-800"><span className="size-2 rounded-sm bg-sky-500" /> NASA satellite · advisory</span>
        )}
          </div>
        )}
      </div>

      {/* Interactive Map with desktop zoom controls + touch gestures */}
      <MapContainer
        center={areaCenter}
        zoom={12}
        zoomControl={false}
        touchZoom={true}                /* Smooth two-finger pinch-to-zoom */
        scrollWheelZoom={true}          /* Smooth wheel & trackpad pinch-to-zoom */
        doubleClickZoom={true}          /* Double tap to zoom */
        dragging={true}                 /* Smooth touch & mouse drag */
        preferCanvas={true}             /* 60fps high-performance canvas rendering */
        style={{ height: '100%', width: '100%', background: '#e2e8f0' }}
      >
        {/* Explicit +/- for mouse/keyboard users (top-right, clear of Layers) */}
        <ZoomControl position="topright" />
        <AutoResize />
        <AreaCenterController center={areaCenter} />
        <RegionPicker active={regionMode} onDone={onRegionSelect} />
        {markedRegion && (
          <Rectangle
            bounds={markedRegion}
            pathOptions={{ color: '#0f172a', weight: 2, dashArray: '6, 4', fillOpacity: 0.06 }}
          >
            <Tooltip direction="top" sticky opacity={0.95}>
              <span className="font-mono text-[11px] font-bold">Marked region — agent answers scope here</span>
            </Tooltip>
          </Rectangle>
        )}

        {/* Standard OpenStreetMap tiles (light command theme) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={darkTiles ? 'dark-tiles' : ''}
          maxZoom={18}
        />

        {/* NASA GIBS satellite overlay — opt-in, advisory only */}
        {layers.satellite && (
          <WMSTileLayer
            url={GIBS_WMS_URL}
            layers={GIBS_LAYER}
            styles=""
            format="image/jpeg"
            transparent={false}
            version="1.1.1"
            params={{ TIME: gibsDate() }}
            opacity={0.9}
            maxNativeZoom={9}
            maxZoom={18}
            attribution={GIBS_ATTRIBUTION}
          />
        )}

        {/* Heatmap layer */}
        {layers.heatmap && (
          <HeatmapLayer
            sensorEvents={sensorEvents}
            incidents={incidents}
            visible={true}
          />
        )}

        {/* Road layer */}
        {layers.roads && (
          <RoadLayer bounds={roadBounds} visible={true} />
        )}

        {/* Risk / safe zones: shaped polygons where surveyed, circles otherwise */}
        {layers.areas && (
          <LayerGroup>
            {areas.map((area) => {
              const poly = (area.polygon || []).filter(
                (p) => p && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))
              )
              const zoneBody = (
                <>
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      {(area.level === 'SAFE' ? '⛺ Safe zone' : '⚠️ Risk zone')}: {area.geohash || area.id || 'Hotspot'} ({area.level || 'HIGH'})
                    </span>
                  </Tooltip>
                  <Popup>
                    <div className="font-mono text-xs space-y-1">
                      <b className="text-slate-900">
                        {area.level === 'SAFE' ? 'Safe Zone' : 'River Risk Area'}: {area.geohash || ''}
                      </b>
                      <p className="text-slate-600">{area.request_count ?? 'unknown'} active calls | {area.high_urgency_count ?? 0} high urgency</p>
                      <p className="text-slate-500">Risk Level: <b className="text-red-600">{area.level || 'HIGH'}</b></p>
                      {area.note && <p className="mt-1 text-slate-700">{area.note}</p>}
                    </div>
                  </Popup>
                </>
              )
              if (poly.length >= 3) {
                return (
                  <Polygon
                    key={area.geohash || area.id}
                    positions={poly}
                    pathOptions={{ weight: 1.5, ...riskStyle(area.level) }}
                  >
                    {zoneBody}
                  </Polygon>
                )
              }
              return area.center ? (
                <Circle
                  key={area.geohash || area.id}
                  center={area.center}
                  radius={area.radius_m || 2000}
                  pathOptions={{ weight: 1, ...riskStyle(area.level) }}
                >
                  {zoneBody}
                </Circle>
              ) : null
            })}
          </LayerGroup>
        )}

        {/* Safe Relief Shelters (EMERALD GREEN 🟢) */}
        {layers.shelters && (
          <LayerGroup>
            {shelters.map((shelter) =>
              okLatLng(shelter.location) ? (
                <LayerGroup key={`shelter-group-${shelter.id}`}>
                  {/* Safe-zone catchment halo so coverage is visible at a glance */}
                  <Circle
                    center={[shelter.location.lat, shelter.location.lng]}
                    radius={700}
                    interactive={false}
                    pathOptions={{
                      color: '#22c55e',
                      fillColor: '#22c55e',
                      fillOpacity: 0.07,
                      weight: 1,
                      dashArray: '5, 5',
                    }}
                  />
                <CircleMarker
                  key={shelter.id}
                  center={[shelter.location.lat, shelter.location.lng]}
                  radius={11}
                  pathOptions={{
                    color: '#15803d',
                    fillColor: '#22c55e',
                    fillOpacity: 0.95,
                    weight: 2.5,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                    <div className="font-mono text-xs font-bold text-emerald-950">
                      🟢 {shelter.name} · {shelter.current_occupancy ?? 0}/{shelter.capacity ?? '∞'} Beds
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <b className="text-emerald-600 font-bold">🟢 Safe Relief Camp</b>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 border border-emerald-200">
                          {Math.max(0, (shelter.capacity || 0) - (shelter.current_occupancy || 0))} FREE
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{shelter.name}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        <div>Capacity: <b className="text-slate-900">{shelter.capacity ?? 'N/A'}</b></div>
                        <div>Occupancy: <b className="text-slate-900">{shelter.current_occupancy ?? 0}</b></div>
                      </div>
                      {shelter.supplies && (
                        <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200">
                          Rations: {shelter.supplies.food_days} days · Water: {shelter.supplies.water_litres}L · Medkits: {shelter.supplies.medical_kits}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
                </LayerGroup>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* Rescue Fleet Battalions (ELECTRIC BLUE 🔵 / PURPLE 🟣) */}
        {layers.teams && (
          <LayerGroup>
            {teams.map((team) =>
              okLatLng(team.location) ? (
                <CircleMarker
                  key={team.id}
                  center={[team.location.lat, team.location.lng]}
                  radius={10}
                  pathOptions={{
                    fillOpacity: 0.95,
                    ...teamColor(team.status),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                    <div className="font-mono text-xs font-bold text-zinc-950">
                      {team.status === 'ON_MISSION' ? '🟣' : '🔵'} {team.name} ({team.status} · Cap {team.capacity})
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <b className="text-blue-600 font-bold">{team.status === 'ON_MISSION' ? '🟣 On Active Mission' : '🔵 Ready for Dispatch'}</b>
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 border border-blue-200">
                          Cap {team.capacity}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{team.name}</p>
                      <p className="text-[11px] text-slate-600">{team.specialization || 'Boat Rescue Unit'}</p>
                      <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                        <div>Total Rescued: <b className="text-slate-900">{team.rescued_total ?? 0} citizens</b></div>
                        {team.contact && <div>Comms: <b className="text-slate-700">{team.contact}</b></div>}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* Team-incident assignment connection lines (need both layers) */}
        {layers.teams && layers.incidents && (
          <LayerGroup>
            {incidents.map((inc) => {
              if (!inc.assigned_team || !inc.location) return null
              const team = teams.find((t) => t.id === inc.assigned_team)
              if (!team?.location) return null
              return (
                <Polyline
                  key={`line-${inc.id}`}
                  positions={[
                    [team.location.lat, team.location.lng],
                    [inc.location.lat, inc.location.lng],
                  ]}
                  pathOptions={{
                    color: '#a855f7',
                    weight: 3.5,
                    opacity: 0.9,
                    dashArray: '6, 4',
                  }}
                >
                  <Tooltip direction="top" sticky opacity={0.95}>
                    <span className="font-mono text-[11px] font-bold text-purple-800">
                      {team.name} → {inc.id} (dispatched)
                    </span>
                  </Tooltip>
                </Polyline>
              )
            })}
          </LayerGroup>
        )}

        {/* SOS Distress Incidents (CRIMSON RED 🔴 / AMBER 🟠 / YELLOW 🟡) */}
        {layers.incidents && (
          <LayerGroup>
            {incidents.map((inc) => {
              if (!okLatLng(inc.location)) return null
              const score = inc.priority?.score ?? 0
              const isCritical = score >= 8
              const isElevated = score >= 4 && score < 8

              return (
                <LayerGroup key={`inc-layer-${inc.id}`}>
                  {/* Selected-incident focus ring — synced with triage queue */}
                  {selectedIncidentId === inc.id && inc.location && (
                    <Circle
                      center={[inc.location.lat, inc.location.lng]}
                      radius={600}
                      pathOptions={{
                        color: '#0f172a',
                        fillColor: '#0f172a',
                        fillOpacity: 0.06,
                        weight: 2,
                      }}
                    />
                  )}
                  {/* Outer Pulsing Danger Radius for Critical SOS */}
                  {isCritical && (
                    <Circle
                      center={[inc.location.lat, inc.location.lng]}
                      radius={1200}
                      pathOptions={{
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 0.12,
                        weight: 1.5,
                        dashArray: '4, 4',
                      }}
                    />
                  )}

                  <CircleMarker
                    center={[inc.location.lat, inc.location.lng]}
                    radius={isCritical ? 12 : isElevated ? 9 : 7}
                    pathOptions={{
                      fillOpacity: 0.95,
                      ...priorityColor(score),
                      ...(selectedIncidentId === inc.id
                        ? { color: '#0f172a', weight: 3 }
                        : {}),
                    }}
                    eventHandlers={onIncidentSelect ? { click: () => onIncidentSelect(inc) } : undefined}
                  >
                    {/* Instant Hover Tooltip with Key Details */}
                    <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                      <div className="font-mono text-xs font-bold text-zinc-950">
                        {isCritical ? '🔴' : isElevated ? '🟠' : '🟡'} {inc.id} · {inc.people ?? 1} People · Score {score}/10
                      </div>
                    </Tooltip>

                    {/* Rich Click Popup with Full SOS Intelligence */}
                    <Popup>
                      <div className="space-y-2 font-sans min-w-[240px]">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {isCritical ? '🔴 CRITICAL SOS' : isElevated ? '🟠 ELEVATED' : '🟡 LOW URGENCY'}
                          </span>
                          <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-black text-white shadow-xs">
                            Score {score}/10
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{inc.raw_text}</p>
                        
                        <div className="rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-600 border border-slate-200 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">People At Risk:</span>
                            <b className="text-slate-900">👥 {inc.people ?? 1} citizens</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Water Status:</span>
                            <b className={inc.water_rising ? 'text-red-600' : 'text-slate-500'}>
                              {inc.water_rising ? '🌊 Rising Fast' : 'Steady'}
                            </b>
                          </div>
                          {inc.vulnerabilities?.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Vulnerabilities:</span>
                              <b className="text-amber-700">{inc.vulnerabilities.join(', ')}</b>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Status:</span>
                            <b className="text-slate-700">{inc.status}</b>
                          </div>
                          {inc.assigned_team && (
                            <div className="flex justify-between pt-1 border-t border-slate-200">
                              <span className="text-slate-500">Dispatched Boat:</span>
                              <b className="text-blue-600">{inc.assigned_team}</b>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                          <span>📍 {readableLocation(inc, 'Incident location')}</span>
                        </div>

                        {onIncidentSelect && (
                          <button
                            onClick={() => onIncidentSelect(inc)}
                            className="w-full rounded bg-slate-100 py-1.5 font-mono text-xs font-bold text-slate-900 hover:bg-zinc-200 transition"
                          >
                            ⚡ Open in Decision Cockpit
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </LayerGroup>
              )
            })}
          </LayerGroup>
        )}

        {/* Citizen Distress Beacons (CYAN 🩵) */}
        {layers.residents && (
          <LayerGroup>
            {residents.map((resident) =>
              resident.location?.lat != null ? (
                <LayerGroup key={`res-group-${resident.id}`}>
                  <Circle
                    center={[resident.location.lat, resident.location.lng]}
                    radius={600}
                    pathOptions={{
                      color: '#06b6d4',
                      fillColor: '#06b6d4',
                      fillOpacity: 0.1,
                      weight: 1,
                      dashArray: '3, 3',
                    }}
                  />
                  <CircleMarker
                    center={[resident.location.lat, resident.location.lng]}
                    radius={resident.people_with ? Math.min(13, 8 + Number(resident.people_with)) : 9}
                    pathOptions={{
                      color: '#0891b2',
                      fillColor: '#06b6d4',
                      fillOpacity: 0.95,
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div className="font-mono text-xs font-bold text-cyan-950">
                        🩵 {resident.name || resident.phone || 'Citizen'} ({resident.people_with ?? 1} People) · {readableLocation(resident, 'Gaur Sector')}
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="font-mono text-xs space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <b className="text-cyan-600 font-bold flex items-center gap-1">
                            🩵 Live Citizen Beacon
                          </b>
                          <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] text-cyan-700 border border-cyan-200 font-bold">
                            {resident.plot_source === 'stated_geocoded' ? 'Chat Stated' : 'GPS'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{resident.name || resident.phone || 'Resident'}</p>
                        <div className="rounded bg-slate-50 p-2 border border-slate-200 space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">People:</span>
                            <b className="text-slate-900">👥 {resident.people_with ?? 1} citizens</b>
                          </div>
                          {resident.vulnerabilities?.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Needs:</span>
                              <b className="text-amber-700">{resident.vulnerabilities.join(', ')}</b>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Status:</span>
                            <b className="text-cyan-700">{resident.status || 'NEEDS_HELP'}</b>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">📍 {readableLocation(resident, 'Rautahat coordinates')}</p>
                        {resident.phone && <p className="text-[10px] text-slate-600">📞 {resident.phone}</p>}
                        
                        {onIncidentSelect && (
                          <p className="rounded bg-cyan-50 px-2 py-1.5 text-center font-mono text-[10px] text-cyan-800 border border-cyan-200">
                            Citizen beacon — no SOS filed yet. Select a red/amber SOS marker to triage.
                          </p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </LayerGroup>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* My Incident Marker */}
        {myIncident?.location && okLatLng(myIncident.location) && (
          <CircleMarker
            center={[myIncident.location.lat, myIncident.location.lng]}
            radius={14}
            pathOptions={{ color: '#ffffff', fillColor: '#ef4444', fillOpacity: 0.95, weight: 3 }}
          >
            <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
              <span className="font-mono text-xs font-bold text-red-950">🚨 Your SOS Request</span>
            </Tooltip>
            <Popup>
              <div className="font-mono text-xs space-y-1">
                <b className="text-red-600">Your Active SOS Request</b>
                <p className="text-slate-900">Status: {myIncident.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}
        {/* Safest-route / mission route overlay (resident + coordinator) */}
        {routeLine && routeLine.length >= 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#14b8a6', weight: 4, opacity: 0.95 }}
          />
        )}

        {/* Best-route preview: exactly ONE green line for the selected SOS
            (white casing = highlight). Alternates live in the side panel as
            text. Gated on the incidents layer so switching layers off
            really clears the map. */}
        {layers.incidents && routeDetail?.routes && (() => {
          const rec = routeDetail.routes.find(
            (r) => r.id === routeDetail.explanation?.recommended_id && (r.coords || []).length >= 2
          )
          if (!rec) return null
              return (
                <LayerGroup key={`preview-${rec.id}`}>
                  {/* Canvas glow sandwich: soft halo + white casing + dark edge + bright core */}
                  <Polyline
                    positions={rec.coords}
                    pathOptions={{ color: '#16a34a', weight: 18, opacity: 0.22 }}
                    interactive={false}
                  />
                  <Polyline
                    positions={rec.coords}
                    pathOptions={{ color: '#ffffff', weight: 12, opacity: 1 }}
                    interactive={false}
                  />
                  <Polyline
                    positions={rec.coords}
                    pathOptions={{ color: '#15803d', weight: 8, opacity: 1 }}
                    interactive={false}
                  />
                  <Polyline
                    positions={rec.coords}
                    pathOptions={{ color: '#4ade80', weight: 4.5, opacity: 1 }}
                  >
                    <Tooltip direction="top" sticky opacity={0.95}>
                      <span className="font-mono text-[11px] font-bold text-green-800">
                        ★ Best route {rec.id} · {rec.distance_km} km · {routeDetail.team?.name || 'team'}
                      </span>
                    </Tooltip>
                  </Polyline>
                </LayerGroup>
              )
        })()}
        {/* Direct connectors render on selection alone — no routes needed.
            Gated on the incidents layer like everything SOS-anchored. */}
        {layers.incidents && (
          <DirectLines
            incidents={incidents}
            shelters={shelters}
            teams={teams}
            selectedIncidentId={selectedIncidentId}
          />
        )}

        {/* Route fetch progress — so waiting is visible, not silent */}
        {layers.incidents && routeLoading && selectedIncidentId && (
          <div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-green-300 bg-white/95 px-3 py-1 font-mono text-[11px] font-bold text-green-800 shadow-lg animate-pulse">
            Computing best route…
          </div>
        )}

        <ScaleControl position="bottomright" />
      </MapContainer>
    </div>
  )
}
