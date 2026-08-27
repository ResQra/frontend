import React, { Component, useEffect, useRef } from 'react'
import L from 'leaflet'
import {
  Circle,
  CircleMarker,
  LayerGroup,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import HeatmapLayer from './HeatmapLayer.jsx'
import RoadLayer from './RoadLayer.jsx'
import LayerToggle from './LayerToggle.jsx'

export const RAUTAHAT_CENTER = [26.7640, 85.2780]
export const KATHMANDU_CENTER = RAUTAHAT_CENTER

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
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-zinc-800 bg-[#09090b] p-6 text-center text-zinc-300 font-mono text-xs space-y-3">
          <p className="text-white font-bold">⚠️ Map Rendering Recovered</p>
          <p className="text-zinc-500 text-[11px] max-w-sm">
            The geospatial canvas encountered an unexpected layer format.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-white px-3 py-1.5 font-bold text-black hover:bg-zinc-200 transition"
          >
            ↻ Reload War Room Canvas
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
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
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
  myIncident = null,
  height = '320px',
  onIncidentSelect = null,
  darkTiles = false,
  areaCenter = KATHMANDU_CENTER,
  areaBounds = null,
  visibleLayers = null,
  onLayerToggle = null,
}) {
  const layers = visibleLayers || {
    heatmap: true,
    roads: true,
    incidents: true,
    teams: true,
    shelters: true,
    residents: true,
    areas: true,
  }

  // Safe bounds for road layer
  const roadBounds = areaBounds || null

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        darkTiles ? 'border-0 bg-[#09090b]' : 'rounded-xl border border-slate-200'
      }`}
      style={{ minHeight: height }}
    >
      {onLayerToggle && (
        <LayerToggle visible={layers} onToggle={onLayerToggle} />
      )}

      {/* Vibrant High-Contrast Emergency Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] hidden items-center gap-3.5 rounded-xl border border-zinc-800 bg-black/90 px-3.5 py-2 text-[11px] font-mono text-zinc-300 shadow-2xl backdrop-blur sm:flex flex-wrap max-w-xl">
        <span className="text-[10px] uppercase font-bold text-zinc-500">LEGEND:</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500 ring-2 ring-red-400/50 animate-pulse" /> 🔴 Critical SOS (≥8)</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" /> 🟠 Elevated SOS (4-7)</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-yellow-400" /> 🟡 Low SOS (0-3)</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-500 ring-1 ring-blue-300" /> 🔵 Ready Boat</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-purple-500 ring-1 ring-purple-300" /> 🟣 On Mission</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500 ring-1 ring-emerald-300" /> 🟢 Safe Shelter</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-cyan-400" /> 🩵 Citizen Beacon</span>
      </div>

      {/* Interactive Map with Smooth 2-Finger Touch Pinch/Zoom and No Zoom Buttons */}
      <MapContainer
        center={areaCenter}
        zoom={12}
        zoomControl={false}             /* Removed + and - buttons */
        touchZoom={true}                /* Smooth two-finger pinch-to-zoom */
        scrollWheelZoom={true}          /* Smooth wheel & trackpad pinch-to-zoom */
        doubleClickZoom={true}          /* Double tap to zoom */
        dragging={true}                 /* Smooth touch & mouse drag */
        preferCanvas={true}             /* 60fps high-performance canvas rendering */
        style={{ height: '100%', width: '100%', background: '#09090b' }}
      >
        <AutoResize />
        <AreaCenterController center={areaCenter} />

        {/* Free Dark OpenStreetMap Tiles with CSS Inversion Filter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={darkTiles ? 'dark-tiles' : ''}
          maxZoom={18}
        />

        {/* Heatmap layer */}
        {layers.heatmap && (
          <HeatmapLayer
            sensorEvents={[]}
            incidents={incidents}
            visible={true}
          />
        )}

        {/* Road layer */}
        {layers.roads && (
          <RoadLayer bounds={roadBounds} visible={true} />
        )}

        {/* Risk zones */}
        {layers.areas && (
          <LayerGroup>
            {areas.map((area) =>
              area.center ? (
                <Circle
                  key={area.geohash || area.id}
                  center={area.center}
                  radius={area.radius_m || 2000}
                  pathOptions={{ weight: 1, ...riskStyle(area.level) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      ⚠️ Risk Zone: {area.geohash || 'Hotspot'} ({area.level || 'HIGH'})
                    </span>
                  </Tooltip>
                  <Popup>
                    <div className="font-mono text-xs space-y-1">
                      <b className="text-white">River Risk Area: {area.geohash || ''}</b>
                      <p className="text-zinc-300">{area.request_count ?? 'unknown'} active calls | {area.high_urgency_count ?? 0} high urgency</p>
                      <p className="text-zinc-400">Risk Level: <b className="text-red-400">{area.level || 'HIGH'}</b></p>
                      {area.note && <p className="mt-1 text-zinc-200">{area.note}</p>}
                    </div>
                  </Popup>
                </Circle>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* Safe Relief Shelters (EMERALD GREEN 🟢) */}
        {layers.shelters && (
          <LayerGroup>
            {shelters.map((shelter) =>
              shelter.location ? (
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
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                        <b className="text-emerald-400 font-bold">🟢 Safe Relief Camp</b>
                        <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-800">
                          {Math.max(0, (shelter.capacity || 0) - (shelter.current_occupancy || 0))} FREE
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs">{shelter.name}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300">
                        <div>Capacity: <b className="text-white">{shelter.capacity ?? 'N/A'}</b></div>
                        <div>Occupancy: <b className="text-white">{shelter.current_occupancy ?? 0}</b></div>
                      </div>
                      {shelter.supplies && (
                        <div className="pt-1 text-[10px] text-zinc-400 border-t border-zinc-800">
                          Rations: {shelter.supplies.food_days} days · Water: {shelter.supplies.water_litres}L · Medkits: {shelter.supplies.medical_kits}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* Rescue Fleet Battalions (ELECTRIC BLUE 🔵 / PURPLE 🟣) */}
        {layers.teams && (
          <LayerGroup>
            {teams.map((team) =>
              team.location ? (
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
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                        <b className="text-blue-400 font-bold">{team.status === 'ON_MISSION' ? '🟣 On Active Mission' : '🔵 Ready for Dispatch'}</b>
                        <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] text-blue-300 border border-blue-800">
                          Cap {team.capacity}
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs">{team.name}</p>
                      <p className="text-[11px] text-zinc-300">{team.specialization || 'Boat Rescue Unit'}</p>
                      <div className="pt-1 text-[11px] text-zinc-400 space-y-0.5">
                        <div>Total Rescued: <b className="text-white">{team.rescued_total ?? 0} citizens</b></div>
                        {team.contact && <div>Comms: <b className="text-zinc-200">{team.contact}</b></div>}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}
          </LayerGroup>
        )}

        {/* Team-incident assignment connection lines */}
        {layers.teams && (
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
                    weight: 2.5,
                    opacity: 0.85,
                    dashArray: '6, 4',
                  }}
                />
              )
            })}
          </LayerGroup>
        )}

        {/* SOS Distress Incidents (CRIMSON RED 🔴 / AMBER 🟠 / YELLOW 🟡) */}
        {layers.incidents && (
          <LayerGroup>
            {incidents.map((inc) => {
              if (!inc.location) return null
              const score = inc.priority?.score ?? 0
              const isCritical = score >= 8
              const isElevated = score >= 4 && score < 8

              return (
                <LayerGroup key={`inc-layer-${inc.id}`}>
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
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                          <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            {isCritical ? '🔴 CRITICAL SOS' : isElevated ? '🟠 ELEVATED' : '🟡 LOW URGENCY'}
                          </span>
                          <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-black text-white shadow-xs">
                            Score {score}/10
                          </span>
                        </div>

                        <p className="text-xs text-zinc-100 font-medium leading-relaxed">{inc.raw_text}</p>
                        
                        <div className="rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-300 border border-zinc-800 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">People At Risk:</span>
                            <b className="text-white">👥 {inc.people ?? 1} citizens</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Water Status:</span>
                            <b className={inc.water_rising ? 'text-red-400' : 'text-zinc-400'}>
                              {inc.water_rising ? '🌊 Rising Fast' : 'Steady'}
                            </b>
                          </div>
                          {inc.vulnerabilities?.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Vulnerabilities:</span>
                              <b className="text-amber-300">{inc.vulnerabilities.join(', ')}</b>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Status:</span>
                            <b className="text-zinc-200">{inc.status}</b>
                          </div>
                          {inc.assigned_team && (
                            <div className="flex justify-between pt-1 border-t border-zinc-800">
                              <span className="text-zinc-500">Dispatched Boat:</span>
                              <b className="text-blue-400">{inc.assigned_team}</b>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                          <span>📍 {readableLocation(inc, 'Incident location')}</span>
                        </div>

                        {onIncidentSelect && (
                          <button
                            onClick={() => onIncidentSelect(inc)}
                            className="w-full rounded bg-white py-1.5 font-mono text-xs font-bold text-black hover:bg-zinc-200 transition"
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
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                          <b className="text-cyan-400 font-bold flex items-center gap-1">
                            🩵 Live Citizen Beacon
                          </b>
                          <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] text-cyan-300 border border-cyan-800 font-bold">
                            {resident.plot_source === 'stated_geocoded' ? 'Chat Stated' : 'GPS'}
                          </span>
                        </div>
                        <p className="font-bold text-white text-sm">{resident.name || resident.phone || 'Resident'}</p>
                        <div className="rounded bg-zinc-950 p-2 border border-zinc-800 space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">People:</span>
                            <b className="text-white">👥 {resident.people_with ?? 1} citizens</b>
                          </div>
                          {resident.vulnerabilities?.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Needs:</span>
                              <b className="text-amber-300">{resident.vulnerabilities.join(', ')}</b>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Status:</span>
                            <b className="text-cyan-300">{resident.status || 'NEEDS_HELP'}</b>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400">📍 {readableLocation(resident, 'Rautahat coordinates')}</p>
                        {resident.phone && <p className="text-[10px] text-zinc-300">📞 {resident.phone}</p>}
                        
                        {onIncidentSelect && (
                          <button
                            onClick={() => onIncidentSelect({
                              id: `inc_from_${resident.id}`,
                              raw_text: `Distress beacon from ${resident.name || 'Citizen'} (${resident.people_with ?? 1} people at ${readableLocation(resident, 'Gaur')})`,
                              people: resident.people_with ?? 1,
                              vulnerabilities: resident.vulnerabilities || [],
                              location_text: readableLocation(resident, 'Gaur'),
                              location: resident.location,
                              urgency: 'HIGH',
                              water_rising: true,
                              priority: { score: 8.5, level: 'CRITICAL', reasons: ['Live Chat Distress Signal', 'Unassigned Citizen Beacon'] },
                              status: 'NEW',
                            })}
                            className="w-full rounded bg-cyan-600 py-1.5 text-center font-mono text-xs font-bold text-white hover:bg-cyan-500 transition"
                          >
                            ⚡ Open in Triage Queue
                          </button>
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
        {myIncident?.location && (
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
                <b className="text-red-400">Your Active SOS Request</b>
                <p className="text-white">Status: {myIncident.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
