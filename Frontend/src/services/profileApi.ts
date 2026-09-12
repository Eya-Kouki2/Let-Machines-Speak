import { apiRequest } from './apiClient'
import type { User } from '../types/admin'

function getBackendBaseUrl(): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000'
  const apiRoot = import.meta.env.VITE_API_URL ?? ''

  if (apiRoot && apiRoot.includes('/api')) {
    return apiRoot.replace(/\/api\/?$/, '').replace(/\/$/, '') || configuredBase.replace(/\/$/, '')
  }

  return configuredBase.replace(/\/$/, '')
}

export function getMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const base = getBackendBaseUrl()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function getProfile(): Promise<User> {
  return apiRequest<User>('/api/users/me')
}

export function updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'age' | 'workZone'>>): Promise<User> {
  return apiRequest<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; user?: User }> {
  return apiRequest<{ success: boolean; message: string; user?: User }>('/api/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function uploadAvatar(file: File): Promise<{ profileImage: string; user: User }> {
  const formData = new FormData()
  formData.append('avatar', file)

  const token = localStorage.getItem('token')
  const backendBase = getBackendBaseUrl()

  return fetch(`${backendBase}/api/users/me/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message ?? 'Unable to upload profile image.')
    }
    return payload.data
  })
}
