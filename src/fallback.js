// Shown only when the backend has no database yet (503) so the resident
// map can still demo. Rautahat District locations mirroring the backend
// seed; delete when the DB is live and trusted.

export const FALLBACK_SHELTERS = [
  { id: 'shelter_gaur_hospital', name: 'Gaur District Hospital & Trauma Center', location: { lat: 26.7640, lng: 85.2780 }, capacity: 160, current_occupancy: 51 },
  { id: 'shelter_stadium', name: 'Rautahat District Sports Stadium Camp', location: { lat: 26.7680, lng: 85.2810 }, capacity: 3000, current_occupancy: 960 },
  { id: 'shelter_juddha', name: 'Juddha Higher Secondary School Relief Camp', location: { lat: 26.7590, lng: 85.2720 }, capacity: 1800, current_occupancy: 576 },
  { id: 'shelter_tikuliya', name: 'Tikuliya Ghat Community Relief Point', location: { lat: 26.7820, lng: 85.2420 }, capacity: 950, current_occupancy: 304 },
  { id: 'shelter_garuda', name: 'Garuda Municipal Evacuation Complex', location: { lat: 26.9250, lng: 85.3120 }, capacity: 2200, current_occupancy: 704 },
  { id: 'shelter_chandrapur', name: 'Chandranigahapur Community Hospital', location: { lat: 27.1250, lng: 85.3400 }, capacity: 300, current_occupancy: 96 },
]
