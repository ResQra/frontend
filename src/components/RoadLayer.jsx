import { useEffect, useState } from 'react'
import { Polyline, CircleMarker, Popup } from 'react-leaflet'
import { api } from '../api.js'

const ROAD_STYLE = {
  color: '#9ca3af',
  weight: 2,
  opacity: 0.7,
}

const BRIDGE_STYLE = {
  color: '#6b7280',
  weight: 3,
  opacity: 0.8,
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

  return (
    <>
      {/* Roads */}
      {roads.map((road) => (
        <Polyline
          key={road.id}
          positions={road.coords}
          pathOptions={ROAD_STYLE}
        >
          <Popup>
            <b>{road.name || 'Road'}</b>
            <br />
            Type: {road.type}
          </Popup>
        </Polyline>
      ))}

      {/* Bridges */}
      {bridges.map((bridge) => (
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
      {blockedEvents.map((evt, i) => (
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
