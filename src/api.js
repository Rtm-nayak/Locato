import { auth } from './firebase'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

async function getIdToken() {
  const user = auth?.currentUser
  if (!user) return null
  return await user.getIdToken()
}

async function request(path, opts = {}) {
  if (!API_BASE) throw new Error('API base not configured')
  const token = await getIdToken()
  const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {})
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || 'API error')
    err.response = res
    throw err
  }
  return json
}

export async function addRegistration(payload) {
  return await request('/api/registrations/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reportAlert(payload) {
  return await request('/api/alerts/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function markAlertAssisted(alertId) {
  // volunteers endpoint
  try {
    return await request(`/api/volunteers/assist/${alertId}`, { method: 'PATCH' })
  } catch (e) {
    // fallback to alerts update
    return await request(`/api/alerts/update-status/${alertId}`, { method: 'PATCH', body: JSON.stringify({ status: 'assisted' }) })
  }
}

export async function updateAlertStatus(alertId, status) {
  return await request(`/api/alerts/update-status/${alertId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export async function matchSearch(query) {
  return await request('/api/match/search', { method: 'POST', body: JSON.stringify({ query }) })
}

export default { addRegistration, reportAlert, markAlertAssisted, updateAlertStatus, matchSearch }
