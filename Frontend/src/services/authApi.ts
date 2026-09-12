import { apiRequest } from './apiClient'
import type { User } from '../types/admin'

export interface AuthResult {
  token: string
  user: User
}

export function login(email: string, password: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/auth/me')
}
