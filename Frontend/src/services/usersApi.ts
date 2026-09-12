import { apiRequest } from './apiClient'
import type { User, UserRole } from '../types/admin'

export interface UserPayload {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  active?: boolean
  firstName?: string | null
  lastName?: string | null
  age?: number | null
  yearsOfExperience?: number | null
  workZone?: string | null
  profileImage?: string | null
}

export const usersApi = {
  list: () => apiRequest<User[]>('/api/users'),
  create: (payload: UserPayload) =>
    apiRequest<User>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<UserPayload>) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest<User>(`/api/users/${id}`, { method: 'DELETE' }),
  approveAdmin: (id: string) => apiRequest<User>(`/api/admin/users/${id}/approve`, { method: 'PATCH' }),
  rejectAdmin: (id: string) => apiRequest<User>(`/api/admin/users/${id}/reject`, { method: 'PATCH' }),
}
