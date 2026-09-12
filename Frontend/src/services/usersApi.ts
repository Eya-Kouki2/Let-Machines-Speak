import { apiRequest } from './apiClient'
import type { User, UserRole } from '../types/admin'

export interface UserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  active?: boolean
}

export const usersApi = {
  list: () => apiRequest<User[]>('/api/users'),
  create: (payload: Required<Pick<UserPayload, 'name' | 'email' | 'password' | 'role'>>) =>
    apiRequest<User>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<UserPayload>) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest<User>(`/api/users/${id}`, { method: 'DELETE' }),
}
