import { apiRequest } from './apiClient'
import type { HealthRecord, Machine, MachineMetrics } from '../types/machineHealth'

export interface EnrichedMachine {
  _id?: string
  machineId: string
  name: string
  zone: string
  type?: string
  description?: string
  enabled: boolean
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL'
  thresholds: {
    vibrationRms: { warning: number; critical: number }
    peakAcceleration: { warning: number; critical: number }
    temperature: { warning: number; critical: number }
    current: { warning: number; critical: number }
    anomalyScore: { warning: number; critical: number }
  }
  lastSeen?: string | null
  createdAt?: string
  updatedAt?: string
  latestHealth?: {
    healthScore: number
    status: 'green' | 'yellow' | 'red'
    temperature: number
    current: number
    rms: number
    peak: number
    timestamp: string
  } | null
}

export function getMachines(): Promise<EnrichedMachine[]> {
  return apiRequest<EnrichedMachine[]>('/api/machines')
}

export function getMachine(machineId: string): Promise<EnrichedMachine> {
  return apiRequest<EnrichedMachine>(`/api/machines/${machineId}`)
}

export function getCurrentHealth(machineId: string): Promise<HealthRecord> {
  return apiRequest<HealthRecord>(`/api/machines/${machineId}/health`)
}

export function getHealthHistory(
  machineId: string,
  options?: number | { range?: string; limit?: number },
): Promise<HealthRecord[]> {
  if (typeof options === 'number') {
    return apiRequest<HealthRecord[]>(`/api/machines/${machineId}/history?limit=${options}`)
  }
  const params = new URLSearchParams()
  if (options?.range) params.set('range', options.range)
  if (options?.limit) params.set('limit', String(options.limit))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<HealthRecord[]>(`/api/machines/${machineId}/history${qs}`)
}

export function getMetrics(machineId: string): Promise<MachineMetrics> {
  return apiRequest<MachineMetrics>(`/api/machines/${machineId}/metrics`)
}

export function simulateMachineData(
  scenario: 'HEALTHY' | 'WARNING' | 'CRITICAL',
  machineId: string,
): Promise<{ machine: Machine; health: HealthRecord }> {
  return apiRequest<{ machine: Machine; health: HealthRecord }>('/api/machines/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenario, machineId }),
  })
}
