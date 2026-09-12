import type { ApiResponse, HealthRecord, Machine, MachineMetrics } from '../types/machineHealth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  const body = (await response.json()) as ApiResponse<T>

  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error?.message ?? 'Unable to load Machine Health data')
  }

  return body.data
}

export function getMachines(): Promise<Machine[]> {
  return request<Machine[]>('/api/machines')
}

export function getMachine(machineId: string): Promise<Machine> {
  return request<Machine>(`/api/machines/${machineId}`)
}

export function getCurrentHealth(machineId: string): Promise<HealthRecord> {
  return request<HealthRecord>(`/api/machines/${machineId}/health`)
}

export function getHealthHistory(machineId: string, limit = 25): Promise<HealthRecord[]> {
  return request<HealthRecord[]>(`/api/machines/${machineId}/history?limit=${limit}`)
}

export function getMetrics(machineId: string): Promise<MachineMetrics> {
  return request<MachineMetrics>(`/api/machines/${machineId}/metrics`)
}

export function simulateMachineData(
  scenario: 'HEALTHY' | 'WARNING' | 'CRITICAL',
  machineId: string,
): Promise<{ machine: Machine; health: HealthRecord }> {
  return request<{ machine: Machine; health: HealthRecord }>('/api/machines/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenario, machineId }),
  })
}
