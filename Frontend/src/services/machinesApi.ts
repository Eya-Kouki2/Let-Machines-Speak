import { apiRequest } from './apiClient'
import type { ManagedMachine, MachineThresholds } from '../types/admin'

export const defaultThresholds: MachineThresholds = {
  vibrationRms: { warning: 4.5, critical: 7.1 },
  peakAcceleration: { warning: 2.0, critical: 4.0 },
  temperature: { warning: 70, critical: 85 },
  current: { warning: 8, critical: 10 },
  anomalyScore: { warning: 0.7, critical: 0.9 },
}

export const machinesApi = {
  list: () => apiRequest<ManagedMachine[]>('/api/machines'),
  create: (payload: Omit<ManagedMachine, '_id' | 'status'> & { status?: ManagedMachine['status'] }) =>
    apiRequest<ManagedMachine>('/api/machines', { method: 'POST', body: JSON.stringify(payload) }),
  update: (machineId: string, payload: Partial<ManagedMachine>) =>
    apiRequest<ManagedMachine>(`/api/machines/${machineId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (machineId: string) => apiRequest<ManagedMachine>(`/api/machines/${machineId}`, { method: 'DELETE' }),
}
