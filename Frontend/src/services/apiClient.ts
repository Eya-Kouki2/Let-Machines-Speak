const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok || body.success === false) {
    throw new Error(body.message ?? body.error?.message ?? 'Request failed')
  }

  return (body.data ?? body) as T
}
