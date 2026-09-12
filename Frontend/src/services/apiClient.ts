const API_ROOT = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

function buildApiUrl(path: string): string {
  const normalizedRoot = API_ROOT.replace(/\/$/, '')

  if (normalizedRoot.endsWith('/api') && path.startsWith('/api/')) {
    return `${normalizedRoot}${path.slice(4)}`
  }

  return `${normalizedRoot}${path}`
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(buildApiUrl(path), {
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
