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

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
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
    const err = new Error(data?.detail || `Request failed (${res.status})`)
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
  changePassword: (old_password, new_password) =>
    request('/api/auth/password', { method: 'PATCH', body: { old_password, new_password } }),
  changePhone: (new_phone) =>
    request('/api/auth/phone', { method: 'PATCH', body: { new_phone } }),
  me: () => request('/api/auth/me'),
  chat: (message) => request('/api/chat', { method: 'POST', body: { message } }),
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
  activity: () => request('/api/ops/activity'),
  opsAssistant: (message, history = []) =>
    request('/api/ops/assistant', { method: 'POST', body: { message, history } }),
  setIncidentStatus: (id, status) =>
    request(`/api/ops/incidents/${id}/status`, { method: 'PATCH', body: { status } }),
  assignTeam: (id, teamId) =>
    request(`/api/ops/incidents/${id}/assign`, { method: 'POST', body: { team_id: teamId } }),
  recommendTeam: (id) => request(`/api/ops/incidents/${id}/recommend`, { method: 'POST' }),
  setTeamStatus: (id, status) =>
    request(`/api/ops/teams/${id}/status`, { method: 'PATCH', body: { status } }),
  publishReport: (body) => request('/api/ops/reports', { method: 'POST', body }),
  opsReports: () => request('/api/ops/reports'),
  deleteReport: (id) => request(`/api/ops/reports/${id}`, { method: 'DELETE' }),
}
