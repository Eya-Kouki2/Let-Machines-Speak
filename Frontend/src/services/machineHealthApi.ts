import { apiRequest } from './apiClient'
import type { HealthRecord, Machine, MachineMetrics } from '../types/machineHealth'

export function getMachines(): Promise<Machine[]> {
  return apiRequest<Machine[]>('/api/machines')
}

export function getMachine(machineId: string): Promise<Machine> {
  return apiRequest<Machine>(`/api/machines/${machineId}`)
}

export function getCurrentHealth(machineId: string): Promise<HealthRecord> {
  return apiRequest<HealthRecord>(`/api/machines/${machineId}/health`)
}

export function getHealthHistory(machineId: string, limit = 25): Promise<HealthRecord[]> {
  return apiRequest<HealthRecord[]>(`/api/machines/${machineId}/history?limit=${limit}`)
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
