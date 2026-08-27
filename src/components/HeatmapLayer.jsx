import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const INTENSITY_MAP = {
  HOTSPOT: 1.0,
  UNSAFE: 0.9,
  CRITICAL: 1.0,
  HIGH: 0.8,
  RISING: 0.6,
  WATCH: 0.4,
  SAFE: 0.1,
  NORMAL: 0.2,
}

function levelToIntensity(level) {
  return INTENSITY_MAP[String(level || '').toUpperCase()] ?? 0.5
}

export default function HeatmapLayer({ sensorEvents = [], incidents = [], visible = true }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    const points = []

    // Sensor events as heatmap points
    for (const event of sensorEvents) {
      const lat = event.payload?.lat
      const lng = event.payload?.lng
      if (lat == null || lng == null) continue
      const intensity = levelToIntensity(event.payload?.level)
      points.push([lat, lng, intensity])
    }

    // Incidents as heatmap points (lower intensity spread)
    for (const inc of incidents) {
      const lat = inc.location?.lat
      const lng = inc.location?.lng
      if (lat == null || lng == null) continue
      const score = inc.priority?.score ?? 3
      points.push([lat, lng, Math.min(1.0, score / 10)])
    }

    if (points.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    try {
      if (typeof L.heatLayer !== 'function') return

      const heatLayer = L.heatLayer(points, {
        radius: 28,
        blur: 18,
        maxZoom: 15,
        max: 1.0,
        gradient: {
          0.1: '#3b82f6',
          0.3: '#06b6d4',
          0.5: '#22c55e',
          0.7: '#eab308',
          0.85: '#f97316',
          1.0: '#ef4444',
        },
      }).addTo(map)

      layerRef.current = heatLayer
    } catch (err) {
      console.warn('HeatmapLayer creation skipped:', err)
    }

    return () => {
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current)
        } catch {
          /* ignore layer removal error */
        }
        layerRef.current = null
      }
    }
  }, [map, sensorEvents, incidents, visible])

  return null
}
