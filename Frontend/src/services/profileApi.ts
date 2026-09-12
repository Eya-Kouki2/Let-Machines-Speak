import { apiRequest } from './apiClient'
import type { User } from '../types/admin'

export function getMediaUrl(path?: string | null): string {
  if (!path) return ''
  const base = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000'
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('http') ? path : `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`
  return normalizedPath
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

  return fetch(`${(import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '')}/api/users/me/avatar`, {
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
