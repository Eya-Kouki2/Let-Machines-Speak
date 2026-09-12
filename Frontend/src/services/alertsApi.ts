import { apiRequest } from './apiClient'

export interface AlertRecord {
  _id: string
  type: string
  category: string
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
  title: string
  message: string
  sourceType?: string
  sourceId?: string
  userId?: string | null
  visibleTo?: 'ALL' | 'ADMINS' | 'USER'
  readBy?: string[]
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, unknown>
}

export interface AlertsListResponse {
  items: AlertRecord[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function getAlerts(params?: Record<string, string | number | undefined>): Promise<AlertsListResponse> {
  const qs = new URLSearchParams()

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value))
    }
  })

  const query = qs.toString()
  return apiRequest<AlertsListResponse>(query ? `/api/alerts?${query}` : '/api/alerts')
}

export function getUnreadAlertCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/api/alerts/unread-count')
}

export function markAlertRead(id: string): Promise<AlertRecord> {
  return apiRequest<AlertRecord>(`/api/alerts/${id}/read`, {
    method: 'PATCH',
  })
}

export function markAllAlertsRead(): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/api/alerts/read-all', {
    method: 'PATCH',
  })
}
