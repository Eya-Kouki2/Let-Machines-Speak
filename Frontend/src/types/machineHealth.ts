export type MachineStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL'
export type AiHealthStatus = 'green' | 'yellow' | 'red'

export interface Machine {
  machineId: string
  name: string
  zone: string
  status: MachineStatus
  lastSeen: string | null
  createdAt?: string
  updatedAt?: string
}

export interface HealthRecord {
  machineId: string
  timestamp: string
  temperature: number
  current: number
  rms: number
  peak: number
  fftBands: number[]
  vibrationPreview: number[]
  healthScore: number
  status: AiHealthStatus
}

export interface MachineMetrics {
  machine: Machine | null
  latestHealth: HealthRecord | null
  history: HealthRecord[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
  }
}
