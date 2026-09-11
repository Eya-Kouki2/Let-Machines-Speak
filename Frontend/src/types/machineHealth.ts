export type MachineHealthStatus = 'green' | 'yellow' | 'red'
export type MachineCondition = 'Healthy' | 'Warning' | 'Critical'
export type MetricSeverity = 'Normal' | 'Elevated' | 'High' | 'Warning' | 'Critical'
export type HistoryRange = '1h' | '24h' | '7d'

export interface Machine {
  id: string
  machineId: string
  name: string
  zone: string
  connected: boolean
  lastSeen: string
  samplingRate: string
}

export interface MachineBaseline {
  temperature: number
  current: number
  rms: number
  peak: number
}

export interface MachineMetric {
  key: keyof MachineBaseline
  label: string
  value: number
  unit: string
  baseline: number
  severity: MetricSeverity
}

export interface FrequencyBin {
  frequency: number
  amplitude: number
}

export interface MachineHealthSnapshot {
  timestamp: string
  healthScore: number
  status: MachineHealthStatus
  explanation: string
  temperature: number
  current: number
  rms: number
  peak: number
  vibrationSignal: number[]
  fftSpectrum: FrequencyBin[]
  dominantFrequency: number
  dominantAmplitude: number
  confidence: number
  aiModel: string
  detectedCondition: string
}

export interface HealthDriver {
  label: string
  severity: MetricSeverity
  detail: string
}

export interface HealthHistoryPoint {
  timestamp: string
  score: number
}

export interface MachineAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  timeAgo: string
}

export interface MachineHealthViewModel {
  machine: Machine
  baseline: MachineBaseline
  snapshot: MachineHealthSnapshot
  metrics: MachineMetric[]
  drivers: HealthDriver[]
  history: Record<HistoryRange, HealthHistoryPoint[]>
  alerts: MachineAlert[]
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
  status: MachineHealthStatus
}

export interface MachineMetrics {
  machine: Machine | null
  latestHealth: HealthRecord | null
  history: HealthRecord[]
}

export interface MachineHealthDataSource {
  getMachines(): Promise<Machine[]>
  getMachineHealth(machineId: string, scenario?: MachineHealthStatus): Promise<MachineHealthViewModel>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
  }
}
