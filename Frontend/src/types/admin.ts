export type UserRole = 'ADMIN' | 'USER' | 'OPERATOR' | 'VIEWER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface User {
  id: string
  name: string
  firstName?: string | null
  lastName?: string | null
  email: string
  role: UserRole
  active: boolean
  isApproved: boolean
  approvalStatus: ApprovalStatus
  age?: number | null
  yearsOfExperience?: number | null
  workZone?: string | null
  profileImage?: string | null
  mustChangePassword?: boolean
  temporaryPasswordIssuedAt?: string | null
  passwordChangedAt?: string | null
  approvedAt?: string | null
  approvedBy?: string | null
  createdAt?: string
  updatedAt?: string
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
