const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export { API }

export function getToken() {
  return localStorage.getItem('ds_token')
}

export function clearAuth() {
  localStorage.removeItem('ds_token')
  localStorage.removeItem('ds_user')
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

export async function authFetch(url, options = {}) {
  const headers = { ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) clearAuth()
  return res
}

export async function authFetchJson(url, method = 'POST', body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { method, headers, body: JSON.stringify(body) })
  if (res.status === 401) clearAuth()
  return res
}

export async function apiGet(path) {
  const res = await authFetch(`${API}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export async function apiPost(path, body) {
  const res = await authFetchJson(`${API}${path}`, 'POST', body)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export async function apiPatch(path, body) {
  const res = await authFetchJson(`${API}${path}`, 'PATCH', body)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export async function apiDelete(path) {
  const res = await authFetch(`${API}${path}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export async function apiUpload(path, formData) {
  const res = await authFetch(`${API}${path}`, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

// ── Domain API Modules ───────────────────────────────────────────────────────
export const postsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiGet(`/posts${qs ? `?${qs}` : ''}`)
  },
  get: (id) => apiGet(`/posts/${id}`),
  create: (data) => apiPost('/posts', data),
  update: (id, data) => apiPatch(`/posts/${id}`, data),
  delete: (id) => apiDelete(`/posts/${id}`)
}

export const communitiesApi = {
  list: () => apiGet('/subreddits'),
  get: (name) => apiGet(`/subreddits/${name}`),
  create: (data) => apiPost('/subreddits', data),
  update: (name, data) => apiPatch(`/subreddits/${name}`, data),
  join: (name) => apiPost(`/subreddits/${name}/join`, {}),
  delete: (name) => apiDelete(`/subreddits/${name}`)
}

export const authApi = {
  login: (creds) => apiPost('/auth/login', creds),
  register: (data) => apiPost('/auth/register', data),
  me: () => apiGet('/auth/me')
}

export const mediaApi = {
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiUpload('/upload', fd)
  }
}

// Patch global fetch — auto-clears auth on any 401 response
{
  const origFetch = window.fetch
  window.fetch = async (...args) => {
    const res = await origFetch(...args)
    if (res.status === 401 && localStorage.getItem('ds_token')) {
      localStorage.removeItem('ds_token')
      localStorage.removeItem('ds_user')
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return res
  }
}
