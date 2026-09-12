import type {
  FrequencyBin,
  HealthDriver,
  HealthHistoryPoint,
  Machine,
  MachineAlert,
  MachineBaseline,
  MachineHealthSnapshot,
  MachineHealthStatus,
  MachineHealthViewModel,
  MachineMetric,
  MetricSeverity,
} from '../types/machineHealth'

const now = new Date('2026-09-11T13:57:42')

export const mockMachines: Machine[] = [
  {
    id: 'motor-01',
    machineId: 'MCH-001',
    name: 'Industrial Motor 01',
    zone: 'Zone 1',
    connected: true,
    lastSeen: now.toISOString(),
    samplingRate: '1 kHz',
  },
  {
    id: 'conveyor-02',
    machineId: 'MCH-002',
    name: 'Conveyor Motor 02',
    zone: 'Zone 2',
    connected: true,
    lastSeen: new Date(now.getTime() - 12_000).toISOString(),
    samplingRate: '1 kHz',
  },
  {
    id: 'pump-03',
    machineId: 'MCH-003',
    name: 'Hydraulic Pump 03',
    zone: 'Hydraulics Bay',
    connected: true,
    lastSeen: new Date(now.getTime() - 31_000).toISOString(),
    samplingRate: '800 Hz',
  },
]

const baselines: Record<string, MachineBaseline> = {
  'motor-01': { temperature: 43, current: 0.92, rms: 0.92, peak: 1.36 },
  'conveyor-02': { temperature: 45, current: 1.05, rms: 0.88, peak: 1.28 },
  'pump-03': { temperature: 48, current: 1.22, rms: 0.96, peak: 1.42 },
}

const scenarioValues = {
  green: {
    healthScore: 92,
    temperature: 41.2,
    current: 0.85,
    rms: 0.82,
    peak: 1.21,
    explanation: 'Machine operating within learned baseline.',
    detectedCondition: 'Normal operating pattern',
    confidence: 94,
    dominantFrequency: 82,
    dominantAmplitude: 0.74,
  },
  yellow: {
    healthScore: 68,
    temperature: 57.4,
    current: 1.15,
    rms: 1.12,
    peak: 1.65,
    explanation: 'Vibration and temperature are trending above baseline.',
    detectedCondition: 'Early vibration drift',
    confidence: 88,
    dominantFrequency: 128,
    dominantAmplitude: 1.36,
  },
  red: {
    healthScore: 30,
    temperature: 76,
    current: 1.8,
    rms: 1.54,
    peak: 2.05,
    explanation: 'Significant vibration anomaly and elevated temperature detected.',
    detectedCondition: 'Possible bearing-related anomaly',
    confidence: 91,
    dominantFrequency: 157,
    dominantAmplitude: 2.05,
  },
} satisfies Record<MachineHealthStatus, Omit<MachineHealthSnapshot, 'timestamp' | 'status' | 'vibrationSignal' | 'fftSpectrum' | 'aiModel'>>

function severityFor(metric: keyof MachineBaseline, delta: number, status: MachineHealthStatus): MetricSeverity {
  if (status === 'red' && (metric === 'rms' || metric === 'temperature')) return 'Critical'
  if (delta > 40) return 'Critical'
  if (delta > 22) return 'Warning'
  if (delta > 10) return metric === 'current' ? 'Elevated' : 'High'
  return 'Normal'
}

function createVibrationSignal(status: MachineHealthStatus, length = 120): number[] {
  const config = {
    green: { amplitude: 0.55, noise: 0.05, spikes: [] as number[] },
    yellow: { amplitude: 0.86, noise: 0.11, spikes: [48, 82] },
    red: { amplitude: 1.18, noise: 0.18, spikes: [24, 58, 91, 104] },
  }[status]

  return Array.from({ length }, (_, index) => {
    const wave = Math.sin(index * 0.34) * config.amplitude
    const harmonic = Math.sin(index * 0.91) * config.amplitude * 0.22
    const noise = Math.sin(index * 2.41) * config.noise
    const spike = config.spikes.includes(index) ? config.amplitude * 0.9 : 0
    return Number((wave + harmonic + noise + spike).toFixed(3))
  })
}

function createSpectrum(status: MachineHealthStatus): FrequencyBin[] {
  const { dominantFrequency, dominantAmplitude } = scenarioValues[status]

  return Array.from({ length: 80 }, (_, index) => {
    const frequency = Math.round((index / 79) * 500)
    const base = 0.08 + Math.abs(Math.sin(index * 0.43)) * 0.12
    const dominantPeak = Math.exp(-Math.pow((frequency - dominantFrequency) / 18, 2)) * dominantAmplitude
    const secondaryPeak = status === 'red'
      ? Math.exp(-Math.pow((frequency - 312) / 26, 2)) * 0.86
      : Math.exp(-Math.pow((frequency - 238) / 32, 2)) * 0.28
    return {
      frequency,
      amplitude: Number((base + dominantPeak + secondaryPeak).toFixed(3)),
    }
  })
}

function createHistory(status: MachineHealthStatus): Record<'1h' | '24h' | '7d', HealthHistoryPoint[]> {
  const scores = {
    green: [88, 89, 91, 90, 92, 93, 92, 91, 92, 92, 93],
    yellow: [92, 91, 89, 87, 82, 78, 74, 71, 69, 68, 68],
    red: [92, 91, 89, 87, 82, 78, 69, 61, 48, 38, 30],
  }[status]

  const makePoints = (stepMinutes: number) => scores.map((score, index) => ({
    timestamp: new Date(now.getTime() - (scores.length - index - 1) * stepMinutes * 60_000).toISOString(),
    score,
  }))

  return {
    '1h': makePoints(6),
    '24h': makePoints(120),
    '7d': makePoints(900),
  }
}

function createMetrics(snapshot: MachineHealthSnapshot, baseline: MachineBaseline): MachineMetric[] {
  return ([
    ['temperature', 'Temperature', snapshot.temperature, '°C'],
    ['current', 'Current', snapshot.current, 'A'],
    ['rms', 'RMS', snapshot.rms, 'g'],
    ['peak', 'Peak', snapshot.peak, 'g'],
  ] as const).map(([key, label, value, unit]) => {
    const delta = ((value - baseline[key]) / baseline[key]) * 100
    return {
      key,
      label,
      value,
      unit,
      baseline: baseline[key],
      severity: severityFor(key, delta, snapshot.status),
    }
  })
}

function createDrivers(metrics: MachineMetric[], status: MachineHealthStatus): HealthDriver[] {
  const fftSeverity: MetricSeverity = status === 'red' ? 'High' : status === 'yellow' ? 'Warning' : 'Normal'

  return [
    { label: 'RMS', severity: metrics.find((metric) => metric.key === 'rms')?.severity ?? 'Normal', detail: deltaText(metrics[2]) },
    { label: 'Temperature', severity: metrics.find((metric) => metric.key === 'temperature')?.severity ?? 'Normal', detail: deltaText(metrics[0]) },
    { label: 'Peak', severity: metrics.find((metric) => metric.key === 'peak')?.severity ?? 'Normal', detail: deltaText(metrics[3]) },
    { label: 'FFT anomaly', severity: fftSeverity, detail: status === 'green' ? 'No dominant anomaly' : 'Dominant band above learned profile' },
  ]
}

function createAlerts(status: MachineHealthStatus): MachineAlert[] {
  if (status === 'green') {
    return [
      { id: 'info-1', severity: 'info', title: 'Machine operating inside learned baseline', timeAgo: '4 min ago' },
      { id: 'info-2', severity: 'info', title: 'AI inference completed successfully', timeAgo: '8 min ago' },
    ]
  }

  if (status === 'yellow') {
    return [
      { id: 'warn-1', severity: 'warning', title: 'Machine temperature above baseline', timeAgo: '7 min ago' },
      { id: 'warn-2', severity: 'warning', title: 'RMS vibration trending upward', timeAgo: '14 min ago' },
      { id: 'info-3', severity: 'info', title: 'Machine entered warning state', timeAgo: '18 min ago' },
    ]
  }

  return [
    { id: 'crit-1', severity: 'critical', title: 'High vibration anomaly detected', timeAgo: '2 min ago' },
    { id: 'crit-2', severity: 'warning', title: 'Machine temperature above baseline', timeAgo: '7 min ago' },
    { id: 'crit-3', severity: 'warning', title: 'Dominant FFT component detected at 157 Hz', timeAgo: '9 min ago' },
    { id: 'crit-4', severity: 'info', title: 'Machine entered warning state', timeAgo: '18 min ago' },
  ]
}

export function deltaText(metric: MachineMetric): string {
  const delta = ((metric.value - metric.baseline) / metric.baseline) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${Math.round(delta)}% vs baseline`
}

export function buildMachineHealthViewModel(machineId: string, scenario: MachineHealthStatus = 'red'): MachineHealthViewModel {
  const machine = mockMachines.find((item) => item.id === machineId) ?? mockMachines[0]
  const baseline = baselines[machine.id]
  const values = scenarioValues[scenario]
  const snapshot: MachineHealthSnapshot = {
    ...values,
    status: scenario,
    timestamp: machine.lastSeen,
    vibrationSignal: createVibrationSignal(scenario),
    fftSpectrum: createSpectrum(scenario),
    aiModel: 'machine-health-v1',
  }
  const metrics = createMetrics(snapshot, baseline)

  return {
    machine,
    baseline,
    snapshot,
    metrics,
    drivers: createDrivers(metrics, scenario),
    history: createHistory(scenario),
    alerts: createAlerts(scenario),
  }
}
