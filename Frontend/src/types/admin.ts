export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

export interface MachineThresholdPair {
  warning: number
  critical: number
}

export interface MachineThresholds {
  vibrationRms: MachineThresholdPair
  peakAcceleration: MachineThresholdPair
  temperature: MachineThresholdPair
  current: MachineThresholdPair
  anomalyScore: MachineThresholdPair
}

export interface ManagedMachine {
  _id?: string
  machineId: string
  name: string
  type?: string
  zone: string
  description?: string
  enabled: boolean
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL'
  thresholds: MachineThresholds
  lastSeen?: string | null
}
