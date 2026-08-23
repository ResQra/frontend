import { useEffect } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'

export const PATNA_CENTER = [25.5941, 85.1376]

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length > 0) {
      map.fitBounds(L.latLngBounds(markers).pad(0.25), { maxZoom: 15 })
    }
  }, [map, markers])
  return null
}

function priorityColor(score) {
  if (score >= 8) return { color: '#b91c1c', fillColor: '#ef4444' }
  if (score >= 4) return { color: '#b45309', fillColor: '#f59e0b' }
  return { color: '#0369a1', fillColor: '#38bdf8' }
}

function readableLocation(item, fallback = 'Location available') {
  const label = item?.location_text || item?.location?.label || item?.device_location?.label || ''
  if (!label || label.toLowerCase() === 'not found') return fallback
  return label
}

export default function MapView({
  shelters = [],
  incidents = [],
  teams = [],
  residents = [],
  areas = [],
  myIncident = null,
  height = '320px',
  onIncidentSelect = null,
  darkTiles = false,
}) {
  const markers = [
    ...shelters.map((s) => (s.location ? [s.location.lat, s.location.lng] : null)),
    ...teams.map((t) => (t.location ? [t.location.lat, t.location.lng] : null)),
    ...incidents.map((i) => (i.location ? [i.location.lat, i.location.lng] : null)),
    ...residents.map((r) => (r.location?.lat != null ? [r.location.lat, r.location.lng] : null)),
    myIncident?.location ? [myIncident.location.lat, myIncident.location.lng] : null,
  ].filter(Boolean)

  return (
    <div
      className={`overflow-hidden ${darkTiles ? 'border-0 bg-[#080b12]' : 'rounded-xl border border-slate-200'}`}
      style={{ height }}
    >
      <MapContainer
        center={PATNA_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            darkTiles
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />
        {areas.map((area) =>
          area.center ? (
            <Circle
              key={area.geohash || area.id}
              center={area.center}
              radius={area.radius_m || 2000}
              pathOptions={{ color: '#ef4444', weight: 1, fillColor: '#ef4444', fillOpacity: 0.12 }}
            >
              <Popup>
                <b>Hotspot</b> {area.geohash || ''}
                <br />
                {area.request_count ?? 'unknown'} requests | {area.high_urgency_count ?? 'unknown'} high urgency
                <br />
                Risk level: {area.level || 'HIGH'}
              </Popup>
            </Circle>
          ) : null
        )}
        <FitBounds markers={markers} />
        {shelters.map((shelter) =>
          shelter.location ? (
            <CircleMarker
              key={shelter.id}
              center={[shelter.location.lat, shelter.location.lng]}
              radius={10}
              pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.8 }}
            >
              <Popup>
                <b>{shelter.name}</b>
                <br />
                Capacity: {shelter.capacity ?? 'unknown'} | Occupancy: {shelter.current_occupancy ?? 0}
                <br />
                {shelter.capacity != null && `${Math.max(0, shelter.capacity - (shelter.current_occupancy ?? 0))} spaces free`}
              </Popup>
            </CircleMarker>
          ) : null
        )}
        {teams.map((team) =>
          team.location ? (
            <CircleMarker
              key={team.id}
              center={[team.location.lat, team.location.lng]}
              radius={9}
              pathOptions={{
                color: '#1d4ed8',
                fillColor: team.status === 'AVAILABLE' ? '#60a5fa' : '#1e3a8a',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <b>{team.name}</b>
                <br />
                {team.status} | Capacity {team.capacity}
                <br />
                {readableLocation(team, 'Team position')}
                {team.contact && (
                  <>
                    <br />
                    Contact: {team.contact}
                  </>
                )}
              </Popup>
            </CircleMarker>
          ) : null
        )}
        {incidents.map((inc) =>
          inc.location ? (
            <CircleMarker
              key={inc.id}
              center={[inc.location.lat, inc.location.lng]}
              radius={12}
              pathOptions={{ fillOpacity: 0.9, ...priorityColor(inc.priority?.score ?? 0) }}
              eventHandlers={onIncidentSelect ? { click: () => onIncidentSelect(inc) } : undefined}
            >
              <Popup>
                <b>{inc.id}</b> | score {inc.priority?.score ?? 0}
                <br />
                {inc.raw_text}
                <br />
                People: {inc.people ?? 'unknown'} | Status: {inc.status}
                <br />
                {readableLocation(inc, 'Incident location')}
                {inc.assigned_team && (
                  <>
                    <br />
                    Team: {inc.assigned_team}
                  </>
                )}
              </Popup>
            </CircleMarker>
          ) : null
        )}
        {residents.map((resident) =>
          resident.location?.lat != null ? (
            <CircleMarker
              key={`res-${resident.id}`}
              center={[resident.location.lat, resident.location.lng]}
              radius={resident.people_with ? Math.min(14, 7 + Number(resident.people_with)) : 8}
              pathOptions={{
                color: resident.plot_source === 'stated_geocoded' ? '#4338ca' : '#92400e',
                fillColor: resident.plot_source === 'stated_geocoded' ? '#818cf8' : '#f59e0b',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <b>{resident.name || resident.phone || 'Resident'}</b>
                <br />
                People: {resident.people_with ?? 'unknown'}
                {resident.vulnerabilities?.length > 0 && (
                  <>
                    <br />
                    Needs: {resident.vulnerabilities.join(', ')}
                  </>
                )}
                <br />
                {readableLocation(resident, resident.plot_source === 'device_gps' ? 'Device GPS location' : 'Resident location')}
                <br />
                Source: {resident.plot_source === 'stated_geocoded' ? 'stated and geocoded' : 'device GPS fallback'}
                {resident.status && resident.status !== 'UNKNOWN' && (
                  <>
                    <br />
                    Status: {resident.status}
                  </>
                )}
                {resident.phone && (
                  <>
                    <br />
                    Phone: {resident.phone}
                  </>
                )}
              </Popup>
            </CircleMarker>
          ) : null
        )}
        {myIncident?.location && (
          <CircleMarker
            center={[myIncident.location.lat, myIncident.location.lng]}
            radius={12}
            pathOptions={{ color: '#b91c1c', fillColor: '#ef4444', fillOpacity: 0.9 }}
          >
            <Popup>
              <b>Your request</b>
              <br />
              Status: {myIncident.status}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
