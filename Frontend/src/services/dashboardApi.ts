import { apiRequest } from './apiClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AttentionMachine {
  machineId: string
  name: string
  zone: string
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE'
  healthScore: number | null
}

export interface MachineSummary {
  total: number
  healthy: number
  warning: number
  critical: number
  offline: number
  averageHealthScore: number | null
  attentionMachines?: AttentionMachine[]
}

export interface SafetySummary {
  zones: number
  safeZones: number
  activeViolations: number
  eventsToday: number
  byType?: Record<string, number>
}

export interface AlertSummary {
  active: number
  critical: number
  today: number
}

export interface DashboardSummary {
  machines: MachineSummary
  safety: SafetySummary
  alerts: AlertSummary
}

export type ActivitySeverity = 'CRITICAL' | 'WARNING' | 'INFO'
export type ActivityType = 'MACHINE_ALERT' | 'SAFETY_EVENT' | 'SYSTEM'

export interface ActivityItem {
  type: ActivityType
  severity: ActivitySeverity
  title: string
  source: string
  timestamp: string
}

export interface HealthTrendPoint {
  timestamp: string
  avgScore: number
  count: number
}

// ---------------------------------------------------------------------------
// Real API calls
// ---------------------------------------------------------------------------
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await apiRequest<DashboardSummary>('/api/dashboard/summary')
    return res
  } catch (err) {
    console.error('Failed to load dashboard summary:', err)
    return {
      machines: { total: 0, healthy: 0, warning: 0, critical: 0, offline: 0, averageHealthScore: null, attentionMachines: [] },
      safety: { zones: 0, safeZones: 0, activeViolations: 0, eventsToday: 0, byType: {} },
      alerts: { active: 0, critical: 0, today: 0 },
    }
  }
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  try {
    const items = await apiRequest<ActivityItem[]>(`/api/dashboard/recent-activity?limit=${limit}`)
    if (Array.isArray(items)) return items
    return []
  } catch (err) {
    console.error('Failed to load recent activity:', err)
    return []
  }
}

export async function getHealthTrend(): Promise<HealthTrendPoint[]> {
  try {
    const data = await apiRequest<HealthTrendPoint[]>('/api/dashboard/health-trend')
    if (Array.isArray(data)) return data
    return []
  } catch (err) {
    console.error('Failed to load health trend:', err)
    return []
  }
}

