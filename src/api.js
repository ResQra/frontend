// Thin API client for the ResQra backend. In local dev, Vite proxies /api to
// localhost:8000. In hosted frontend builds, set VITE_API_BASE_URL to the
// deployed backend origin, for example https://api.example.com.

const TOKEN_KEY = 'resqra_token'
const USER_KEY = 'resqra_user'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

function errorMessage(detail, fallback) {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => typeof item === 'string' ? item : item?.msg)
      .filter(Boolean)
    if (messages.length) return messages.join('; ')
  }
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') return detail.message
    try {
      return JSON.stringify(detail)
    } catch {
      return fallback
    }
  }
  return fallback
}

async function request(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (fetchErr) {
    clearTimeout(timer)
    if (fetchErr.name === 'AbortError') {
      throw new Error('Connection timed out — server took too long to respond.')
    }
    throw fetchErr
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (res.status === 401 && !path.includes('/auth/')) {
    // expired/invalid session — recover instead of showing an empty app
    clearSession()
    window.location.href = '/login'
    throw new Error('Session expired — please sign in again')
  }
  if (!res.ok) {
    const err = new Error(errorMessage(data?.detail, `Request failed (${res.status})`))
    err.status = res.status
    throw err
  }
  return data
}

async function requestForm(path, formData, { timeoutMs = 25000 } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    })
  } catch (fetchErr) {
    clearTimeout(timer)
    if (fetchErr.name === 'AbortError') {
      throw new Error('Upload timed out — server took too long to respond.')
    }
    throw fetchErr
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (res.status === 401 && !path.includes('/auth/')) {
    clearSession()
    window.location.href = '/login'
    throw new Error('Session expired — please sign in again')
  }
  if (!res.ok) {
    const err = new Error(errorMessage(data?.detail, `Request failed (${res.status})`))
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  requestOtp: (phone, name) =>
    request('/api/auth/otp/request', { method: 'POST', body: { phone, name } }),
  verifyOtp: (phone, code, name) =>
    request('/api/auth/otp/verify', { method: 'POST', body: { phone, code, name } }),
  adminLogin: (username, password) =>
    request('/api/auth/admin/login', { method: 'POST', body: { username, password } }),
  demoLogin: (role = 'resident') =>
    request(`/api/auth/demo/login?role=${encodeURIComponent(role)}`, { method: 'POST' }),
  changePassword: (old_password, new_password) =>
    request('/api/auth/password', { method: 'PATCH', body: { old_password, new_password } }),
  changePhone: (new_phone) =>
    request('/api/auth/phone', { method: 'PATCH', body: { new_phone } }),
  me: () => request('/api/auth/me'),
  chat: (message) => request('/api/chat', { method: 'POST', body: { message }, timeoutMs: 30000 }),
  chatHistory: () => request('/api/chat/history'),
  createIncident: (body) => request('/api/incidents', { method: 'POST', body }),
  myIncidents: () => request('/api/incidents/mine'),
  publicMapData: () => request('/api/public/map-data'),
  reports: () => request('/api/public/reports'),
  guides: (category, language) => {
    const q = new URLSearchParams()
    if (category) q.set('category', category)
    if (language) q.set('language', language)
    const qs = q.toString()
    return request(`/api/public/guides${qs ? `?${qs}` : ''}`)
  },
  guideDetail: (id) => request(`/api/public/guides/${id}`),
  updateLocation: (lat, lng, label = '') =>
    request('/api/users/me/location', {
      method: 'PATCH',
      body: { lat, lng, label },
    }),

  actionBoard: () => request('/api/ops/action-board'),
  queue: () => request('/api/ops/queue'),
  opsSummary: () => request('/api/ops/summary'),
  opsMapData: () => request('/api/ops/map-data'),
  opsTeams: () => request('/api/ops/teams'),
  createTeam: (body) => request('/api/ops/teams', { method: 'POST', body }),
  pendingActions: () => request('/api/ops/pending-actions'),
  decidePendingAction: (id, body) =>
    request(`/api/ops/pending-actions/${id}/decision`, { method: 'POST', body }),
  activity: () => request('/api/ops/activity'),
  opsAssistant: (message, history = [], area_context = null, session_id = null) =>
    request('/api/ops/assistant', { method: 'POST', body: { message, history, area_context, session_id }, timeoutMs: 45000 }),
  listChatSessions: () => request('/api/ops/assistant/sessions'),
  createChatSession: (body = {}) =>
    request('/api/ops/assistant/sessions', { method: 'POST', body }),
  chatSessionHistory: (id) => request(`/api/ops/assistant/sessions/${encodeURIComponent(id)}/history`),
  renameChatSession: (id, title) =>
    request(`/api/ops/assistant/sessions/${encodeURIComponent(id)}`, { method: 'PATCH', body: { title } }),
  deleteChatSession: (id) =>
    request(`/api/ops/assistant/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  assistantImage: (file, { message = '', session_id = null, area = null } = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('message', message)
    if (session_id) fd.append('session_id', session_id)
    if (area) fd.append('area', area)
    return requestForm('/api/ops/assistant/image', fd)
  },
  assistantVoice: (blob, { session_id = null, area = null, tts = true } = {}) => {
    const fd = new FormData()
    fd.append('file', blob, 'voice-note.webm')
    if (session_id) fd.append('session_id', session_id)
    if (area) fd.append('area', area)
    fd.append('tts', String(tts))
    return requestForm('/api/ops/assistant/voice', fd)
  },
  setIncidentStatus: (id, status) =>
    request(`/api/ops/incidents/${id}/status`, { method: 'PATCH', body: { status } }),
  assignTeam: (id, teamId) =>
    request(`/api/ops/incidents/${id}/assign`, { method: 'POST', body: { team_id: teamId } }),
  recommendTeam: (id) => request(`/api/ops/incidents/${id}/recommend`, { method: 'POST', timeoutMs: 45000 }),
  routePreview: (incidentId, teamId) =>
    request(`/api/agents/route-preview?incident_id=${encodeURIComponent(incidentId)}${teamId ? `&team_id=${encodeURIComponent(teamId)}` : ''}`),
  debate: (incidentId) =>
    request('/api/agents/debate', { method: 'POST', body: { incident_id: incidentId }, timeoutMs: 60000 }),
  setTeamStatus: (id, status) =>
    request(`/api/ops/teams/${id}/status`, { method: 'PATCH', body: { status } }),
  updateTeamLocation: (id, body) =>
    request(`/api/ops/teams/${id}/location`, { method: 'PATCH', body }),
  reportTeamProblem: (id, body) =>
    request(`/api/ops/teams/${id}/problem`, { method: 'POST', body }),
  postSensorEvent: (body) => request('/api/ops/sensor-events', { method: 'POST', body }),
  recomputeDensityRisk: () => request('/api/ops/risk/recompute-density', { method: 'POST' }),
  updateShelterOccupancy: (id, body) =>
    request(`/api/ops/shelters/${id}/occupancy`, { method: 'PATCH', body }),
  publishReport: (body) => request('/api/ops/reports', { method: 'POST', body }),
  opsReports: () => request('/api/ops/reports'),
  deleteReport: (id) => request(`/api/ops/reports/${id}`, { method: 'DELETE' }),
  incidentTimeline: (id) => request(`/api/ops/incidents/${id}/timeline`),

  // Multi-Agent Observability & Control
  agentsStatus: () => request('/api/ops/agents/status'),
  triggerAgentSweep: () => request('/api/ops/agents/sweep', { method: 'POST' }),

  // Phase 2 map adapter + resident safest-route hook
  mapGev: (bbox = null, area = 'rautahat') => {
    const q = bbox ? `?sw_lat=${bbox[0][0]}&sw_lng=${bbox[0][1]}&ne_lat=${bbox[1][0]}&ne_lng=${bbox[1][1]}&area=${area}` : `?area=${area}`
    return request(`/api/map/gev${q}`)
  },
  safestRoute: (body) => request('/api/public/safest-route', { method: 'POST', body }),
  areaPresets: () => request('/api/area/presets'),
  areaConfig: (area) => request(`/api/area/config?area=${encodeURIComponent(area)}`),
  areaRoads: (swLat, swLng, neLat, neLng) =>
    request(`/api/area/roads?sw_lat=${swLat}&sw_lng=${swLng}&ne_lat=${neLat}&ne_lng=${neLng}`),

  // Simulation reset (arch §66 — unified POST /simulation/* lands in Phase 9)
  demoReset: () => request('/api/ops/demo/reset', { method: 'POST' }),
}
