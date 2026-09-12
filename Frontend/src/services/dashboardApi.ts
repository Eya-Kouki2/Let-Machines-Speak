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
// Fallback / mock data (used when backend is unreachable or returns empty)
// ---------------------------------------------------------------------------
const MOCK_SUMMARY: DashboardSummary = {
  machines: { total: 6, healthy: 4, warning: 1, critical: 1, offline: 0, averageHealthScore: 78 },
  safety: { zones: 4, safeZones: 3, activeViolations: 1, eventsToday: 3 },
  alerts: { active: 3, critical: 1, today: 3 },
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    type: 'MACHINE_ALERT',
    severity: 'CRITICAL',
    title: 'High vibration detected',
    source: 'Industrial Motor 01',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    type: 'SAFETY_EVENT',
    severity: 'WARNING',
    title: 'No helmet detected',
    source: 'Zone 1',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    type: 'SAFETY_EVENT',
    severity: 'WARNING',
    title: 'Restricted zone entry',
    source: 'Zone 2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    type: 'MACHINE_ALERT',
    severity: 'INFO',
    title: 'Health score recovered',
    source: 'Machine 03',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
]

function generateMockTrend(): HealthTrendPoint[] {
  const now = Date.now()
  return Array.from({ length: 12 }, (_, i) => ({
    timestamp: new Date(now - (11 - i) * 2 * 60 * 60 * 1000).toISOString(),
    avgScore: 60 + Math.round(Math.sin(i * 0.5) * 15 + Math.random() * 8),
    count: 3,
  }))
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await apiRequest<DashboardSummary>('/api/dashboard/summary')
  } catch {
    return MOCK_SUMMARY
  }
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  try {
    const items = await apiRequest<ActivityItem[]>(`/api/dashboard/recent-activity?limit=${limit}`)
    if (Array.isArray(items) && items.length > 0) return items
    return MOCK_ACTIVITY
  } catch {
    return MOCK_ACTIVITY
  }
}

export async function getHealthTrend(): Promise<HealthTrendPoint[]> {
  try {
    const data = await apiRequest<HealthTrendPoint[]>('/api/dashboard/health-trend')
    if (Array.isArray(data) && data.length >= 2) return data
    return generateMockTrend()
  } catch {
    return generateMockTrend()
  }
}
