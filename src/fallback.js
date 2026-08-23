// Shown only when the backend has no database yet (503) so the resident
// map can still demo. Mirrors backend/scripts/seed.py; delete when the DB
// is live and trusted.

export const FALLBACK_SHELTERS = [
  { id: 'shelter_1', name: 'Govt High School, Kankarbagh', location: { lat: 25.5812, lng: 85.1471 }, capacity: 400, current_occupancy: 112 },
  { id: 'shelter_2', name: 'Miller High School, Raja Bazar', location: { lat: 25.6042, lng: 85.1301 }, capacity: 350, current_occupancy: 88 },
  { id: 'shelter_3', name: 'Bihar Veterinary College Ground', location: { lat: 25.6112, lng: 85.1011 }, capacity: 600, current_occupancy: 240 },
  { id: 'shelter_4', name: "Patna Women's College", location: { lat: 25.6012, lng: 85.1371 }, capacity: 300, current_occupancy: 95 },
  { id: 'shelter_5', name: 'Moin-ul-Haq Stadium', location: { lat: 25.5932, lng: 85.1221 }, capacity: 800, current_occupancy: 410 },
  { id: 'shelter_6', name: 'Danapur Cantonment Hall', location: { lat: 25.6292, lng: 85.0471 }, capacity: 250, current_occupancy: 61 },
]
