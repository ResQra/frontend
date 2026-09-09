import { useEffect, useState } from 'react'
import { Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { api } from '../api.js'

const ROAD_STYLE = {
  color: '#9ca3af',
  weight: 2,
  opacity: 0.35,
}

const BRIDGE_STYLE = {
  color: '#6b7280',
  weight: 3,
  opacity: 0.45,
}

const BLOCKED_ROAD_STYLE = {
  color: '#ef4444',
  weight: 3.5,
  opacity: 0.95,
}

export default function RoadLayer({ bounds, visible = true }) {
  const [roads, setRoads] = useState([])
  const [bridges, setBridges] = useState([])
  const [blockedEvents, setBlockedEvents] = useState([])

  useEffect(() => {
    if (!visible || !bounds) return
    const [sw, ne] = bounds
    let active = true

    api
      .areaRoads(sw[0], sw[1], ne[0], ne[1])
      .then((data) => {
        if (!active) return
        setRoads(data.roads || [])
        setBridges(data.bridges || [])
        setBlockedEvents(data.blocked_events || [])
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [bounds, visible])

  if (!visible || !bounds) return null

  const okPair = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
  const okLine = (coords) =>
    Array.isArray(coords) && coords.length >= 2 &&
    coords.every((p) => Array.isArray(p) && okPair(p[0], p[1]))

  return (
    <>
      {/* Roads — dimmed base so critical overlays stay legible */}
      {roads.filter((road) => okLine(road.coords)).map((road) => {
        const blocked = road.blocked === true
        return (
          <Polyline
            key={road.id}
            positions={road.coords}
            pathOptions={blocked ? { ...BLOCKED_ROAD_STYLE, dashArray: '8, 6' } : ROAD_STYLE}
          >
            <Popup>
              <b>{road.name || 'Road'}</b>
              <br />
              Type: {road.type}
              {blocked && (
                <>
                  <br />
                  <b className="text-red-600">⛔ BLOCKED</b>
                </>
              )}
            </Popup>
          </Polyline>
        )
      })}

      {/* Bridges */}
      {bridges.filter((bridge) => okLine(bridge.coords)).map((bridge) => (
        <Polyline
          key={bridge.id}
          positions={bridge.coords}
          pathOptions={BRIDGE_STYLE}
        >
          <Popup>
            <b>{bridge.name || 'Bridge'}</b>
            <br />
            Type: {bridge.type} | Bridge
          </Popup>
        </Polyline>
      ))}

      {/* Blocked event markers */}
      {blockedEvents.filter((evt) => okPair(evt.lat, evt.lng)).map((evt, i) => (
        <CircleMarker
          key={`blocked-${i}`}
          center={[evt.lat, evt.lng]}
          radius={14}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#fca5a5',
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '4, 4',
          }}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
            <span className="font-mono text-[11px] font-bold text-red-800">
              ⛔ {evt.kind} · {evt.level}
            </span>
          </Tooltip>
          <Popup>
            <b>{evt.kind}</b>
            <br />
            Level: {evt.level}
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}
