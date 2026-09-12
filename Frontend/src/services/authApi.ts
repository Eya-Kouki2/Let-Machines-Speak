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

export interface SignUpPayload {
  name?: string
  firstName?: string
  lastName?: string
  email: string
  password: string
  accountType: 'USER' | 'ADMIN_REQUEST'
  age?: number
  yearsOfExperience?: number
  workZone?: string
}

export function signUp(payload: SignUpPayload): Promise<Partial<AuthResult> & { message?: string; user?: User }> {
  return apiRequest<Partial<AuthResult> & { message?: string; user?: User }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/auth/me')
}
