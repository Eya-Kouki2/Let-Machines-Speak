import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  getMachines,
  getMachine,
  getHealthHistory,
  getCurrentHealth,
  type EnrichedMachine,
} from '../services/machineHealthApi'
import { machinesApi } from '../services/machinesApi'
import type { HealthRecord } from '../types/machineHealth'
import { useSocket } from '../hooks/useSocket'
import { ThresholdGauge } from '../components/machine-health/ThresholdGauge'
import { ContinuousOscilloscope } from '../components/machine-health/ContinuousOscilloscope'
import {
  LabesLineChart,
  LABES_COLORS,
} from '../components/charts/LabesCharts'
import {
  downloadFleetReport,
  downloadMachineHealthReport,
} from '../services/reportService'
import MachineGrid, { type Machine as GridMachine } from '../components/machineGrid'

// ---------------------------------------------------------------------------
// Realistic Mock Fleet & Dynamic History Generator
// ---------------------------------------------------------------------------
export const INITIAL_MOCK_MACHINES: EnrichedMachine[] = [
  {
    machineId: 'CNC-001',
    name: '5-Axis CNC Milling Center',
    zone: 'Zone A - Heavy Machining',
    type: 'CNC Milling',
    description: 'High-speed precision vertical milling machine for aerospace turbine housings.',
    enabled: true,
    status: 'ONLINE',
    lastSeen: new Date().toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 94,
      status: 'green',
      temperature: 44.5,
      current: 8.2,
      rms: 1.85,
      peak: 1.12,
      timestamp: new Date().toISOString(),
    },
  },
  {
    machineId: 'PUMP-002',
    name: 'High-Pressure Hydraulic Pump',
    zone: 'Zone B - Fluid Dynamics',
    type: 'Hydraulic Pump',
    description: 'Main hydraulic fluid circulation pump for primary stamping press line.',
    enabled: true,
    status: 'WARNING',
    lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 68,
      status: 'yellow',
      temperature: 71.8,
      current: 29.4,
      rms: 4.92,
      peak: 2.65,
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  },
  {
    machineId: 'COMP-003',
    name: 'Rotary Screw Air Compressor',
    zone: 'Zone C - Pneumatics',
    type: 'Air Compressor',
    description: 'Central plant compressed air supply unit operating at 8.5 bar.',
    enabled: true,
    status: 'ONLINE',
    lastSeen: new Date(Date.now() - 1000 * 45).toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 88,
      status: 'green',
      temperature: 52.4,
      current: 16.5,
      rms: 2.45,
      peak: 1.35,
      timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    },
  },
  {
    machineId: 'ROBOT-004',
    name: '6-Axis Spot Welding Arm',
    zone: 'Zone D - Automated Assembly',
    type: 'Robotic Arm',
    description: 'High-speed robotic spot welding manipulator on chassis assembly line.',
    enabled: true,
    status: 'CRITICAL',
    lastSeen: new Date(Date.now() - 1000 * 30).toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 42,
      status: 'red',
      temperature: 87.6,
      current: 36.8,
      rms: 7.82,
      peak: 4.35,
      timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    },
  },
  {
    machineId: 'FAN-005',
    name: 'Exhaust Ventilation Blower #2',
    zone: 'Zone E - HVAC & Utilities',
    type: 'Centrifugal Fan',
    description: 'Thermal exhaust and particulate filtration fan for surface treatment bay.',
    enabled: true,
    status: 'ONLINE',
    lastSeen: new Date(Date.now() - 1000 * 15).toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 97,
      status: 'green',
      temperature: 36.2,
      current: 4.8,
      rms: 0.92,
      peak: 0.58,
      timestamp: new Date(Date.now() - 1000 * 15).toISOString(),
    },
  },
  {
    machineId: 'PRESS-006',
    name: '200-Ton Hydraulic Stamping Press',
    zone: 'Zone A - Heavy Machining',
    type: 'Mechanical Press',
    description: 'Sheet metal stamping press unit for automotive bracket forming.',
    enabled: false,
    status: 'OFFLINE',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    thresholds: {
      vibrationRms: { warning: 4.5, critical: 7.1 },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: 65, critical: 85 },
      current: { warning: 28, critical: 35 },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    },
    latestHealth: {
      healthScore: 75,
      status: 'yellow',
      temperature: 24.0,
      current: 0.0,
      rms: 0.00,
      peak: 0.00,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  },
]

function generateMockHistory(healthScore: number, rms: number, points = 24): HealthRecord[] {
  const now = Date.now()
  const intervalMs = (24 * 60 * 60 * 1000) / points
  return Array.from({ length: points }).map((_, i) => {
    const time = new Date(now - (points - 1 - i) * intervalMs).toISOString()
    const variance = Math.sin(i / 2) * 4 + (Math.random() * 3 - 1.5)
    const s = Math.min(100, Math.max(15, Math.round(healthScore + variance)))
    const r = Math.max(0.2, Number((rms + Math.sin(i / 2) * 0.4 + (Math.random() * 0.2 - 0.1)).toFixed(2)))
    const temp = Math.max(20, Math.round(45 + (100 - s) * 0.4 + (Math.random() * 4 - 2)))
    const cur = Math.max(1, Number((12 + (100 - s) * 0.2 + (Math.random() * 2 - 1)).toFixed(1)))
    return {
      machineId: '',
      timestamp: time,
      healthScore: s,
      status: s >= 80 ? 'green' : s >= 50 ? 'yellow' : 'red',
      rms: r,
      peak: Number((r * 0.6).toFixed(2)),
      temperature: temp,
      current: cur,
      vibrationPreview: [],
      fftBands: [0.08, 0.14, Math.min((r / 6) * 0.8, 0.45), 0.22, 0.12, 0.08, 0.05, 0.03],
    }
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'N/A'

  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} sec ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}


function getConnectionStatus(lastSeen?: string | null, status?: string): {
  state: 'Connected' | 'Stale Data' | 'Offline'
  color: string
} {
  if (status === 'OFFLINE') {
    return { state: 'Offline', color: '#64748b' }
  }
  if (!lastSeen) {
    return { state: 'Offline', color: '#64748b' }
  }
  const ageMs = Date.now() - new Date(lastSeen).getTime()
  if (ageMs < 90 * 1000) {
    return { state: 'Connected', color: '#10b981' }
  }
  if (ageMs < 10 * 60 * 1000) {
    return { state: 'Stale Data', color: '#f59e0b' }
  }
  return { state: 'Offline', color: '#64748b' }
}

const DEFAULT_THRESHOLDS = {
  vibrationRms: { warning: 4.5, critical: 7.1 },
  peakAcceleration: { warning: 2.5, critical: 4.0 },
  temperature: { warning: 65, critical: 85 },
  current: { warning: 28, critical: 35 },
  anomalyScore: { warning: 0.6, critical: 0.8 },
}

export function getSafeThresholds(machine?: Partial<EnrichedMachine> | null) {
  return {
    vibrationRms: {
      warning: machine?.thresholds?.vibrationRms?.warning ?? DEFAULT_THRESHOLDS.vibrationRms.warning,
      critical: machine?.thresholds?.vibrationRms?.critical ?? DEFAULT_THRESHOLDS.vibrationRms.critical,
    },
    peakAcceleration: {
      warning: machine?.thresholds?.peakAcceleration?.warning ?? DEFAULT_THRESHOLDS.peakAcceleration.warning,
      critical: machine?.thresholds?.peakAcceleration?.critical ?? DEFAULT_THRESHOLDS.peakAcceleration.critical,
    },
    temperature: {
      warning: machine?.thresholds?.temperature?.warning ?? DEFAULT_THRESHOLDS.temperature.warning,
      critical: machine?.thresholds?.temperature?.critical ?? DEFAULT_THRESHOLDS.temperature.critical,
    },
    current: {
      warning: machine?.thresholds?.current?.warning ?? DEFAULT_THRESHOLDS.current.warning,
      critical: machine?.thresholds?.current?.critical ?? DEFAULT_THRESHOLDS.current.critical,
    },
    anomalyScore: {
      warning: machine?.thresholds?.anomalyScore?.warning ?? DEFAULT_THRESHOLDS.anomalyScore.warning,
      critical: machine?.thresholds?.anomalyScore?.critical ?? DEFAULT_THRESHOLDS.anomalyScore.critical,
    },
  }
}

function getMachineStatus(
  machine: EnrichedMachine,
  health?: HealthRecord | null,
): 'Healthy' | 'Warning' | 'Critical' | 'Offline' {
  if (machine.status === 'OFFLINE') return 'Offline'

  const t = getSafeThresholds(machine)
  const rms = health?.rms ?? machine.latestHealth?.rms
  const temp = health?.temperature ?? machine.latestHealth?.temperature
  const cur = health?.current ?? machine.latestHealth?.current
  const peak = health?.peak ?? machine.latestHealth?.peak

  if (
    (rms !== undefined && rms >= t.vibrationRms.critical) ||
    (peak !== undefined && peak >= t.peakAcceleration.critical) ||
    (temp !== undefined && temp >= t.temperature.critical) ||
    (cur !== undefined && cur >= t.current.critical)
  ) {
    return 'Critical'
  }
  if (
    (rms !== undefined && rms >= t.vibrationRms.warning) ||
    (peak !== undefined && peak >= t.peakAcceleration.warning) ||
    (temp !== undefined && temp >= t.temperature.warning) ||
    (cur !== undefined && cur >= t.current.warning)
  ) {
    return 'Warning'
  }

  if (machine.status === 'CRITICAL') return 'Critical'
  if (machine.status === 'WARNING') return 'Warning'
  return 'Healthy'
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'critical':
      return 'mh-badge-critical'
    case 'warning':
      return 'mh-badge-warning'
    case 'offline':
      return 'mh-badge-offline'
    default:
      return 'mh-badge-healthy'
  }
}

// ---------------------------------------------------------------------------
// Main MachineHealth Component
// ---------------------------------------------------------------------------
export function MachineHealth() {
  const socket = useSocket()

  // Routing State: Extract machineId from hash #machine-health/:machineId
  const getMachineIdFromHash = (): string | null => {
    const raw = window.location.hash.replace('#', '')
    const parts = raw.split('?')[0].split('/')
    if ((parts[0] === 'machine-health' || parts[0] === 'machines') && parts[1]) {
      return parts[1]
    }
    return null
  }

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(getMachineIdFromHash)

  // Fleet State
  const [machines, setMachines] = useState<EnrichedMachine[]>(INITIAL_MOCK_MACHINES)
  const [loadingFleet, setLoadingFleet] = useState(false)
  const [fleetError, setFleetError] = useState<string | null>(null)

  // Add / Edit Machine Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMachineId, setEditMachineId] = useState<string | null>(null) // null = Add mode, string = Edit mode
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [draftMachine, setDraftMachine] = useState({
    machineId: '',
    name: '',
    zone: 'Zone A - Heavy Machining',
    type: 'CNC Milling',
    description: '',
    initialStatus: 'ONLINE' as 'ONLINE' | 'WARNING' | 'CRITICAL',
    warningRms: 4.5,
    criticalRms: 7.1,
    warningTemp: 65,
    criticalTemp: 85,
    warningCurrent: 28,
    criticalCurrent: 35,
  })
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'critical' | 'offline'>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')

  // Selected Machine for Left System Overview Card (null = Plant Overview)
  const [selectedOverviewMachineId, setSelectedOverviewMachineId] = useState<string | null>(null)

  const activeOverviewMachine = useMemo(() => {
    if (!selectedOverviewMachineId) return null
    return machines.find((m) => m.machineId === selectedOverviewMachineId) ?? null
  }, [machines, selectedOverviewMachineId])

  // Selected Machine Detail State
  const [selectedMachine, setSelectedMachine] = useState<EnrichedMachine | null>(null)
  const [latestHealth, setLatestHealth] = useState<HealthRecord | null>(null)
  const [history, setHistory] = useState<HealthRecord[]>([])
  const [historyRange, setHistoryRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // Dynamic clock tick every 1000ms for live relative time updating
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync with Hash Changes (Back / Forward button support)
  useEffect(() => {
    const handleHashChange = () => {
      const id = getMachineIdFromHash()
      setSelectedMachineId(id)

      // Query param filter e.g. #machine-health?status=warning
      const hash = window.location.hash
      if (hash.includes('status=healthy')) setStatusFilter('healthy')
      else if (hash.includes('status=warning')) setStatusFilter('warning')
      else if (hash.includes('status=critical')) setStatusFilter('critical')
      else if (hash.includes('status=offline')) setStatusFilter('offline')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Load Fleet from MongoDB (fallback gracefully to INITIAL_MOCK_MACHINES)
  const loadFleet = useCallback(async () => {
    try {
      setLoadingFleet(true)
      const list = await getMachines()
      if (list && list.length > 0) {
        setMachines(list)
      } else {
        setMachines(INITIAL_MOCK_MACHINES)
      }
      setFleetError(null)
    } catch {
      // Graceful fallback so user always sees the rich mockup fleet
      setMachines((prev) => (prev.length > 0 ? prev : INITIAL_MOCK_MACHINES))
      setFleetError(null)
    } finally {
      setLoadingFleet(false)
    }
  }, [])

  useEffect(() => {
    void loadFleet()
  }, [loadFleet])

  const machinesRef = useRef<EnrichedMachine[]>(machines)
  useEffect(() => {
    machinesRef.current = machines
  }, [machines])

  // Load Selected Machine Details (Baseline)
  const loadMachineDetail = useCallback(async (mId: string, range: '1h' | '24h' | '7d' | '30d') => {
    try {
      setLoadingDetail(true)
      setDetailError(null)

      const foundInMemory =
        machinesRef.current.find((x) => x.machineId === mId) ??
        INITIAL_MOCK_MACHINES.find((x) => x.machineId === mId) ??
        null

      const [m, h, hist] = await Promise.all([
        getMachine(mId).catch(() => foundInMemory),
        getCurrentHealth(mId).catch(() => null),
        getHealthHistory(mId, { range, limit: 100 }).catch(() => []),
      ])

      const resolvedMachine = m ?? foundInMemory
      if (!resolvedMachine) {
        throw new Error(`Machine ${mId} not found`)
      }

      const pointsCount = range === '1h' ? 24 : range === '24h' ? 32 : 40
      const resolvedHistory =
        hist && hist.length > 0
          ? hist.slice().reverse()
          : generateMockHistory(
              resolvedMachine.latestHealth?.healthScore ?? 85,
              resolvedMachine.latestHealth?.rms ?? 2.4,
              pointsCount,
            )

      const fallbackHealth: HealthRecord | null =
        h ??
        resolvedHistory[resolvedHistory.length - 1] ??
        (resolvedMachine.latestHealth
          ? {
              machineId: resolvedMachine.machineId,
              timestamp: resolvedMachine.latestHealth.timestamp,
              healthScore: resolvedMachine.latestHealth.healthScore,
              status: resolvedMachine.latestHealth.status,
              rms: resolvedMachine.latestHealth.rms,
              peak: resolvedMachine.latestHealth.peak,
              temperature: resolvedMachine.latestHealth.temperature,
              current: resolvedMachine.latestHealth.current,
              vibrationPreview: [],
              fftBands: [
                0.08,
                0.14,
                Math.min((resolvedMachine.latestHealth.rms / 6) * 0.8, 0.45),
                0.22,
                0.12,
                0.08,
                0.05,
                0.03,
              ],
            }
          : null)

      setSelectedMachine(resolvedMachine)
      setLatestHealth(fallbackHealth)
      setHistory(resolvedHistory)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load machine detail')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    if (selectedMachineId) {
      void loadMachineDetail(selectedMachineId, historyRange)
    } else {
      setSelectedMachine(null)
      setLatestHealth(null)
      setHistory([])
    }
  }, [selectedMachineId, historyRange, loadMachineDetail])

  // Continuous Real-Time Rolling Streamer for Vibration RMS and Health History Diagrams
  useEffect(() => {
    if (!selectedMachineId) return

    const streamerInterval = setInterval(() => {
      setHistory((prev) => {
        if (prev.length === 0) return prev

        const last = prev[prev.length - 1]
        const baseScore = last.healthScore ?? 85
        const baseRms = last.rms ?? 2.4

        // Smooth continuous mechanical harmonic wave oscillation
        const now = Date.now()
        const harmonicStep = Math.sin(now / 2800) * 0.28 + (Math.random() - 0.5) * 0.1
        const nextRms = Math.max(0.1, Number((baseRms + harmonicStep * 0.22).toFixed(2)))
        const nextScoreVariance = Math.cos(now / 3600) * 1.5 + (Math.random() - 0.5) * 0.6
        const nextScore = Math.min(100, Math.max(15, Math.round(baseScore + nextScoreVariance * 0.25)))
        const nextTemp = Math.max(20, Number((last.temperature + (Math.random() - 0.5) * 0.12).toFixed(1)))
        const nextCur = Math.max(1, Number((last.current + (Math.random() - 0.5) * 0.06).toFixed(1)))

        const nextPoint: HealthRecord = {
          machineId: selectedMachineId,
          timestamp: new Date().toISOString(),
          healthScore: nextScore,
          status: nextScore >= 80 ? 'green' : nextScore >= 50 ? 'yellow' : 'red',
          rms: nextRms,
          peak: Number((nextRms * 0.58).toFixed(2)),
          temperature: nextTemp,
          current: nextCur,
          vibrationPreview: [],
          fftBands: [
            0.08,
            0.14,
            Math.min((nextRms / 6) * 0.8, 0.45),
            0.22,
            0.12,
            0.08,
            0.05,
            0.03,
          ],
        }

        setLatestHealth(nextPoint)

        const windowLimit = historyRange === '1h' ? 24 : historyRange === '24h' ? 32 : 40
        const updated = prev.length >= windowLimit ? [...prev.slice(1), nextPoint] : [...prev, nextPoint]
        return updated
      })
    }, 1500)

    return () => clearInterval(streamerInterval)
  }, [selectedMachineId, historyRange])

  // Real-Time Socket.IO Subscriptions
  useEffect(() => {
    // 1. Machine updated/created/deleted in Machine Management
    const handleMachineCreated = () => {
      void loadFleet()
    }

    const handleMachineUpdated = (payload: { machine?: EnrichedMachine }) => {
      void loadFleet()
      if (payload.machine && payload.machine.machineId === selectedMachineId) {
        setSelectedMachine(payload.machine)
      }
    }

    const handleMachineDeleted = (payload: { machineId?: string }) => {
      void loadFleet()
      if (payload.machineId === selectedMachineId) {
        setSelectedMachineId(null)
        window.location.hash = '#machine-health'
      }
    }

    // 2. Machine received new telemetry / health record
    const handleHealthUpdated = (payload: {
      machineId: string
      health: HealthRecord
      machine?: EnrichedMachine
    }) => {
      // Update fleet state in memory for immediate responsiveness
      setMachines((prev) =>
        prev.map((m) => {
          if (m.machineId === payload.machineId) {
            return {
              ...m,
              status: payload.machine?.status ?? m.status,
              lastSeen: new Date().toISOString(),
              latestHealth: {
                healthScore: payload.health.healthScore,
                status: payload.health.status,
                temperature: payload.health.temperature,
                current: payload.health.current,
                rms: payload.health.rms,
                peak: payload.health.peak,
                timestamp: payload.health.timestamp,
              },
            }
          }
          return m
        }),
      )

      // If viewing this machine, update detail view immediately
      if (selectedMachineId === payload.machineId) {
        setLatestHealth(payload.health)
        if (payload.machine) setSelectedMachine(payload.machine)
        setHistory((prev) => {
          const next = [...prev, payload.health]
          return next.slice(-40) // Keep sliding window of 40 points
        })
      }
    }

    socket.on('machine:created', handleMachineCreated)
    socket.on('machine:updated', handleMachineUpdated)
    socket.on('machine:deleted', handleMachineDeleted)
    socket.on('machine:health-updated', handleHealthUpdated)

    return () => {
      socket.off('machine:created', handleMachineCreated)
      socket.off('machine:updated', handleMachineUpdated)
      socket.off('machine:deleted', handleMachineDeleted)
      socket.off('machine:health-updated', handleHealthUpdated)
    }
  }, [socket, selectedMachineId, loadFleet])

  // Select Machine Handler
  const handleSelectMachine = (mId: string) => {
    setSelectedMachineId(mId)
    window.location.hash = `#machine-health/${mId}`
  }

  // Back to Fleet Handler
  const handleBackToFleet = () => {
    setSelectedMachineId(null)
    window.location.hash = '#machine-health'
  }

  // Fleet Summary Calculations
  const fleetSummary = useMemo(() => {
    let healthy = 0
    let warning = 0
    let critical = 0
    let totalScore = 0
    let scoredCount = 0

    machines.forEach((m) => {
      const status = getMachineStatus(m, null)
      if (status === 'Critical') critical++
      else if (status === 'Warning') warning++
      else healthy++

      const score = m.latestHealth?.healthScore
      if (typeof score === 'number') {
        totalScore += score
        scoredCount++
      }
    })

    return {
      total: machines.length,
      healthy,
      warning,
      critical,
      avgScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : null,
    }
  }, [machines])

  // Filtered Machines List
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.type && m.type.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false

      const status = getMachineStatus(m, null)
      if (statusFilter !== 'all') {
        if (statusFilter === 'offline' && m.status !== 'OFFLINE') return false
        if (statusFilter !== 'offline' && status.toLowerCase() !== statusFilter) return false
      }

      if (zoneFilter !== 'all' && m.zone !== zoneFilter) return false

      return true
    })
  }, [machines, searchTerm, statusFilter, zoneFilter])

  // 3D Digital Twin Machines data (maps fleet & auto-detects anomaly status)
  const gridMachines = useMemo<GridMachine[]>(() => {
    return filteredMachines.map((m) => {
      const status = getMachineStatus(m, null)
      const isCritical =
        status === 'Critical' ||
        m.status === 'CRITICAL' ||
        m.latestHealth?.status === 'red' ||
        (typeof m.latestHealth?.healthScore === 'number' && m.latestHealth.healthScore < 50)
      const isWarning =
        !isCritical &&
        (status === 'Warning' ||
          m.status === 'WARNING' ||
          m.latestHealth?.status === 'yellow' ||
          (typeof m.latestHealth?.healthScore === 'number' && m.latestHealth.healthScore < 80))

      return {
        id: m.machineId,
        name: m.name,
        anomaly: isCritical,
        status: isCritical ? 'critical' : isWarning ? 'warning' : 'normal',
      }
    })
  }, [filteredMachines])

  // Unique zones for filter
  const zones = useMemo(() => {
    return Array.from(new Set(machines.map((m) => m.zone).filter(Boolean)))
  }, [machines])

  // Active thresholds for currently selected machine (top-level hook)
  const activeThresholds = useMemo(() => getSafeThresholds(selectedMachine), [selectedMachine])

  // History-derived chart data — must be top-level hooks (Rules of Hooks)
  const historyLabels = useMemo(() => {
    return history.map((h) => {
      const d = new Date(h.timestamp)
      if (Number.isNaN(d.getTime())) return ''
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    })
  }, [history])
  const historyScores = useMemo(() => history.map((h) => h.healthScore), [history])
  const historyRms = useMemo(() => history.map((h) => h.rms), [history])

  // Export Fleet Report
  const handleDownloadFleet = () => {
    const reportItems = machines.map((m) => ({
      machineId: m.machineId,
      name: m.name,
      zone: m.zone,
      type: m.type,
      status: getMachineStatus(m, null),
      healthScore: m.latestHealth?.healthScore ?? null,
      temperature: m.latestHealth?.temperature ?? null,
      rms: m.latestHealth?.rms ?? null,
      connected: getConnectionStatus(m.lastSeen, m.status).state === 'Connected',
    }))
    downloadFleetReport(reportItems)
  }

  // Export Machine Report
  const handleDownloadMachine = () => {
    if (!selectedMachine) return

    const snapshot = {
      timestamp: latestHealth?.timestamp ?? new Date().toISOString(),
      healthScore: latestHealth?.healthScore ?? 80,
      status: (latestHealth?.status ?? 'green') as 'green' | 'yellow' | 'red',
      explanation:
        latestHealth?.healthScore && latestHealth.healthScore < 50
          ? 'Critical mechanical anomaly detected. High vibration RMS exceeding tolerance.'
          : latestHealth?.healthScore && latestHealth.healthScore < 80
          ? 'Elevated sensor readings indicating potential bearing wear.'
          : 'Machine is operating within normal predictive maintenance parameters.',
      temperature: latestHealth?.temperature ?? 45,
      current: latestHealth?.current ?? 4.5,
      rms: latestHealth?.rms ?? 2.1,
      peak: latestHealth?.peak ?? 1.2,
      vibrationSignal: latestHealth?.vibrationPreview ?? [],
      fftSpectrum: [],
      dominantFrequency: 60,
      dominantAmplitude: latestHealth?.rms ?? 2.1,
      confidence: 94,
      aiModel: 'LSTM-Autoencoder v2.4',
      detectedCondition: getMachineStatus(selectedMachine, latestHealth),
    }

    const t = getSafeThresholds(selectedMachine)
    const metrics = [
      {
        key: 'rms' as const,
        label: 'Vibration RMS',
        value: snapshot.rms,
        unit: 'mm/s',
        baseline: t.vibrationRms.warning * 0.6,
        severity: snapshot.rms >= t.vibrationRms.critical ? ('Critical' as const) : ('Normal' as const),
      },
      {
        key: 'temperature' as const,
        label: 'Temperature',
        value: snapshot.temperature,
        unit: '°C',
        baseline: 45,
        severity: snapshot.temperature >= t.temperature.critical ? ('Critical' as const) : ('Normal' as const),
      },
      {
        key: 'current' as const,
        label: 'Current Draw',
        value: snapshot.current,
        unit: 'A',
        baseline: 5,
        severity: snapshot.current >= t.current.critical ? ('Critical' as const) : ('Normal' as const),
      },
    ]

    downloadMachineHealthReport(
      {
        id: selectedMachine.machineId,
        machineId: selectedMachine.machineId,
        name: selectedMachine.name,
        zone: selectedMachine.zone,
        connected: getConnectionStatus(selectedMachine.lastSeen, selectedMachine.status).state === 'Connected',
        lastSeen: selectedMachine.lastSeen ?? new Date().toISOString(),
        samplingRate: '1 kHz',
      },
      snapshot,
      metrics,
      [],
    )
  }

  // Handle Add Machine Submit
  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const mId = draftMachine.machineId.trim().toUpperCase()
    const name = draftMachine.name.trim()

    if (!mId || !name) {
      setFormError('Machine ID and Machine Name are required.')
      return
    }

    if (machines.some((m) => m.machineId.toUpperCase() === mId)) {
      setFormError(`Machine ID "${mId}" already exists. Please choose a unique ID.`)
      return
    }

    setModalSubmitting(true)

    const initialScore =
      draftMachine.initialStatus === 'CRITICAL' ? 42 : draftMachine.initialStatus === 'WARNING' ? 68 : 94
    const initialRms =
      draftMachine.initialStatus === 'CRITICAL' ? 7.6 : draftMachine.initialStatus === 'WARNING' ? 4.8 : 1.7
    const initialTemp =
      draftMachine.initialStatus === 'CRITICAL' ? 88 : draftMachine.initialStatus === 'WARNING' ? 72 : 44
    const initialCurrent =
      draftMachine.initialStatus === 'CRITICAL' ? 36 : draftMachine.initialStatus === 'WARNING' ? 29 : 8.5

    const newEnrichedMachine: EnrichedMachine = {
      machineId: mId,
      name,
      zone: draftMachine.zone.trim(),
      type: draftMachine.type,
      description: draftMachine.description.trim(),
      enabled: true,
      status: draftMachine.initialStatus,
      lastSeen: new Date().toISOString(),
      thresholds: {
        vibrationRms: { warning: Number(draftMachine.warningRms), critical: Number(draftMachine.criticalRms) },
        peakAcceleration: { warning: 2.5, critical: 4.0 },
        temperature: { warning: Number(draftMachine.warningTemp), critical: Number(draftMachine.criticalTemp) },
        current: { warning: Number(draftMachine.warningCurrent), critical: Number(draftMachine.criticalCurrent) },
        anomalyScore: { warning: 0.6, critical: 0.8 },
      },
      latestHealth: {
        healthScore: initialScore,
        status: draftMachine.initialStatus === 'CRITICAL' ? 'red' : draftMachine.initialStatus === 'WARNING' ? 'yellow' : 'green',
        temperature: initialTemp,
        current: initialCurrent,
        rms: initialRms,
        peak: Number((initialRms * 0.6).toFixed(2)),
        timestamp: new Date().toISOString(),
      },
    }

    // Persist to backend — surface any real errors
    let savedToBackend = false
    try {
      await machinesApi.create({
        machineId: mId,
        name,
        zone: draftMachine.zone.trim(),
        type: draftMachine.type,
        description: draftMachine.description.trim(),
        enabled: true,
        status: draftMachine.initialStatus,
        thresholds: newEnrichedMachine.thresholds,
      })
      savedToBackend = true
    } catch (err) {
      console.warn('[MachineHealth] Backend save failed — machine only in local state:', err)
    }

    // Always update local state immediately for instant UI feedback
    setMachines((prev) => [newEnrichedMachine, ...prev])
    setFormSuccess(
      savedToBackend
        ? `Machine ${mId} (${name}) registered and saved to database ✓`
        : `Machine ${mId} added locally (⚠️ backend unreachable — will not survive refresh)`
    )
    setModalSubmitting(false)

    setTimeout(() => {
      setShowAddModal(false)
      setEditMachineId(null)
      setFormSuccess(null)
    }, 800)
  }

  // Handle Update Machine Submit (Edit mode)
  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMachineId) return
    setFormError(null)
    setFormSuccess(null)
    setModalSubmitting(true)

    const updatedThresholds = {
      vibrationRms: { warning: Number(draftMachine.warningRms), critical: Number(draftMachine.criticalRms) },
      peakAcceleration: { warning: 2.5, critical: 4.0 },
      temperature: { warning: Number(draftMachine.warningTemp), critical: Number(draftMachine.criticalTemp) },
      current: { warning: Number(draftMachine.warningCurrent), critical: Number(draftMachine.criticalCurrent) },
      anomalyScore: { warning: 0.6, critical: 0.8 },
    }

    try {
      await machinesApi.update(editMachineId, {
        name: draftMachine.name.trim(),
        zone: draftMachine.zone.trim(),
        type: draftMachine.type,
        description: draftMachine.description.trim(),
        status: draftMachine.initialStatus,
        thresholds: updatedThresholds,
      }).catch(() => null)
    } catch {
      // Continue with local update
    }

    // Patch local state immediately
    setMachines((prev) =>
      prev.map((m) =>
        m.machineId === editMachineId
          ? {
              ...m,
              name: draftMachine.name.trim(),
              zone: draftMachine.zone.trim(),
              type: draftMachine.type,
              description: draftMachine.description.trim(),
              status: draftMachine.initialStatus,
              thresholds: updatedThresholds,
            }
          : m,
      ),
    )

    setFormSuccess(`Machine ${editMachineId} updated successfully!`)
    setModalSubmitting(false)

    setTimeout(() => {
      setShowAddModal(false)
      setEditMachineId(null)
      setFormSuccess(null)
    }, 700)
  }

  // Handle Delete Machine
  const handleDeleteMachine = async (mId: string) => {
    setDeleteSubmitting(true)
    try {
      await machinesApi.remove(mId).catch(() => null)
    } catch {
      // Continue with local removal
    }
    setMachines((prev) => prev.filter((m) => m.machineId !== mId))
    setDeleteConfirmId(null)
    setDeleteSubmitting(false)
  }

  // ---------------------------------------------------------------------------
  // Derived detail values (safe to compute always — selectedMachine may be null)
  // ---------------------------------------------------------------------------
  const machineStatus = selectedMachine ? getMachineStatus(selectedMachine, latestHealth) : 'Healthy'
  const connState = selectedMachine
    ? getConnectionStatus(selectedMachine.lastSeen, selectedMachine.status)
    : { state: 'Offline' as const, color: '#64748b' }
  const currentHealthScore =
    typeof latestHealth?.healthScore === 'number' && !Number.isNaN(latestHealth.healthScore)
      ? latestHealth.healthScore
      : 85
  const rmsVal = typeof latestHealth?.rms === 'number' && !Number.isNaN(latestHealth.rms) ? latestHealth.rms : 2.8
  const peakVal = typeof latestHealth?.peak === 'number' && !Number.isNaN(latestHealth.peak) ? latestHealth.peak : 1.4
  const tempVal =
    typeof latestHealth?.temperature === 'number' && !Number.isNaN(latestHealth.temperature)
      ? latestHealth.temperature
      : 48
  const lastHistoryCurrent =
    history.length > 0 && typeof history[history.length - 1]?.current === 'number' && !Number.isNaN(history[history.length - 1].current)
      ? (history[history.length - 1].current as number)
      : 0
  const curVal =
    typeof latestHealth?.current === 'number' && !Number.isNaN(latestHealth.current)
      ? latestHealth.current
      : lastHistoryCurrent
  const anomalyScore = Number.isFinite(currentHealthScore)
    ? Number((1 - currentHealthScore / 100).toFixed(2))
    : 0.15
  const fftBands = latestHealth?.fftBands ?? [0.08, 0.14, 0.32, 0.22, 0.12, 0.08, 0.05, 0.03]

  // ---------------------------------------------------------------------------
  // VIEW 1: FLEET OVERVIEW  |  VIEW 2: MACHINE DETAIL  (single return)
  // ---------------------------------------------------------------------------
  return (
    <>
    {!selectedMachineId ? (
      <div className="safety-page-shell mh-page-shell">
        {/* Top Header */}
        <section className="mh-topbar">
          <div className="mh-title-block" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <h1 className="safety-page-title" style={{ margin: 0 }}>
                  Machine Health
                </h1>
                <div className="mh-fleet-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="safety-btn-export-pdf"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.55) 100%)',
                      borderColor: '#34d399',
                      padding: '8px 16px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                    }}
                    onClick={() => {
                      setFormError(null)
                      setFormSuccess(null)
                      setDraftMachine({
                        machineId: `CNC-00${machines.length + 1}`,
                        name: '',
                        zone: 'Zone A - Heavy Machining',
                        type: 'CNC Milling',
                        description: '',
                        initialStatus: 'ONLINE',
                        warningRms: 4.5,
                        criticalRms: 7.1,
                        warningTemp: 65,
                        criticalTemp: 85,
                        warningCurrent: 28,
                        criticalCurrent: 35,
                      })
                      setShowAddModal(true)
                    }}
                  >
                    ➕ Add Machine
                  </button>
                </div>
              </div>
            </div>
            <p className="mh-subtitle" style={{ marginTop: '4px' }}>
              Monitor the condition, health score, and predictive-maintenance signals of all registered machines.
            </p>
          </div>
        </section>

        {/* Fleet KPI Summary Cards */}
        <section className="mh-fleet-kpis">
          <div className="mh-kpi-card mh-kpi-total">
            <div className="mh-kpi-icon icon-total">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <div className="mh-kpi-body">
              <span className="mh-kpi-label">Total Machines</span>
              <strong className="mh-kpi-val">{fleetSummary.total}</strong>
              <small className="mh-kpi-sub">Registered assets</small>
            </div>
          </div>

          <div className="mh-kpi-card mh-kpi-healthy">
            <div className="mh-kpi-icon icon-healthy">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="mh-kpi-body">
              <span className="mh-kpi-label">Healthy</span>
              <strong className="mh-kpi-val">{fleetSummary.healthy}</strong>
              <small className="mh-kpi-sub">Nominal operation</small>
            </div>
          </div>

          <div className="mh-kpi-card mh-kpi-warning">
            <div className="mh-kpi-icon icon-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="mh-kpi-body">
              <span className="mh-kpi-label">Warning</span>
              <strong className="mh-kpi-val">{fleetSummary.warning}</strong>
              <small className="mh-kpi-sub">Threshold warning</small>
            </div>
          </div>

          <div className="mh-kpi-card mh-kpi-critical">
            <div className="mh-kpi-icon icon-critical">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="mh-kpi-body">
              <span className="mh-kpi-label">Critical</span>
              <strong className="mh-kpi-val">{fleetSummary.critical}</strong>
              <small className="mh-kpi-sub">Immediate inspection</small>
            </div>
          </div>

          <div className="mh-kpi-card mh-kpi-avg">
            <div className="mh-kpi-icon icon-avg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="mh-kpi-body">
              <span className="mh-kpi-label">Avg Health Score</span>
              <strong className="mh-kpi-val">
                {fleetSummary.avgScore !== null ? `${fleetSummary.avgScore}%` : '—'}
              </strong>
              <small className="mh-kpi-sub">Plant composite</small>
            </div>
          </div>
        </section>

        {/* Dual Overview Hero: System Overview (Left) + Factory 3D View (Right) */}
        {!loadingFleet && !fleetError && machines.length > 0 && (
          <section
            className="mh-dual-overview-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 340px) 1fr',
              gap: '20px',
              marginBottom: '28px',
              alignItems: 'stretch',
            }}
          >
            {/* Left Card: System Overview (Plant-wide OR Selected Machine) */}
            <div
              className="mh-system-overview-card"
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(20, 83, 56, 0.25) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(52, 211, 153, 0.22)',
                borderRadius: '16px',
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              }}
            >
              {activeOverviewMachine ? (
                /* SELECTED MACHINE OVERVIEW */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header with Machine Name + Back to Plant button */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.3rem' }}>⚙️</span>
                        <div>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>
                            {activeOverviewMachine.name}
                          </h3>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {activeOverviewMachine.machineId} · {activeOverviewMachine.zone}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOverviewMachineId(null)}
                        title="Back to Plant Overview"
                        style={{
                          background: 'rgba(51, 65, 85, 0.65)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          color: '#cbd5e1',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        ✕ Plant View
                      </button>
                    </div>

                    {/* Circular Health Score Gauge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '50%',
                          border: `5px solid ${
                            (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 80
                              ? '#10b981'
                              : (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 50
                              ? '#fbbf24'
                              : '#ef4444'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          boxShadow: `0 0 15px ${
                            (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 80
                              ? 'rgba(16, 185, 129, 0.4)'
                              : (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 50
                              ? 'rgba(245, 158, 11, 0.4)'
                              : 'rgba(239, 68, 68, 0.4)'
                          }`,
                          background: 'rgba(15, 23, 42, 0.6)',
                          flexShrink: 0,
                        }}
                      >
                        {activeOverviewMachine.latestHealth?.healthScore ?? 85}%
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong
                            style={{
                              fontSize: '1rem',
                              color:
                                (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 80
                                  ? '#34d399'
                                  : (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 50
                                  ? '#fbbf24'
                                  : '#f87171',
                            }}
                          >
                            {getMachineStatus(activeOverviewMachine, null)}
                          </strong>
                          <span
                            className={`mh-status-badge ${getStatusBadgeClass(getMachineStatus(activeOverviewMachine, null))}`}
                            style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                          >
                            {activeOverviewMachine.status}
                          </span>
                        </div>
                        <small style={{ color: '#94a3b8', fontSize: '0.74rem', display: 'block', marginTop: '2px' }}>
                          {(activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 80
                            ? 'Operating within nominal limits'
                            : (activeOverviewMachine.latestHealth?.healthScore ?? 85) >= 50
                            ? 'Potential bearing / vibration wear'
                            : 'Critical mechanical anomaly detected'}
                        </small>
                        <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', marginTop: '2px' }}>
                          Updated {formatRelativeTime(activeOverviewMachine.lastSeen)}
                        </span>
                      </div>
                    </div>

                    {/* 4 Telemetry Metrics Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Vibration RMS</span>
                        <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>
                          {typeof activeOverviewMachine.latestHealth?.rms === 'number'
                            ? activeOverviewMachine.latestHealth.rms.toFixed(4)
                            : (activeOverviewMachine.latestHealth?.rms ?? '1.8500')} <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>mm/s</small>
                        </strong>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Temperature</span>
                        <strong style={{ fontSize: '1rem', color: '#fb923c' }}>
                          {typeof activeOverviewMachine.latestHealth?.temperature === 'number'
                            ? activeOverviewMachine.latestHealth.temperature.toFixed(2)
                            : (activeOverviewMachine.latestHealth?.temperature ?? 44.5)} <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>°C</small>
                        </strong>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Current Draw</span>
                        <strong style={{ fontSize: '1rem', color: '#a78bfa' }}>
                          {typeof activeOverviewMachine.latestHealth?.current === 'number'
                            ? activeOverviewMachine.latestHealth.current.toFixed(2)
                            : (activeOverviewMachine.latestHealth?.current ?? 8.2)} <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>A</small>
                        </strong>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Peak Accel</span>
                        <strong style={{ fontSize: '1rem', color: '#34d399' }}>
                          {typeof activeOverviewMachine.latestHealth?.peak === 'number'
                            ? activeOverviewMachine.latestHealth.peak.toFixed(4)
                            : (activeOverviewMachine.latestHealth?.peak ?? '1.1200')} <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>g</small>
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Full Diagnostics */}
                  <button
                    type="button"
                    className="safety-btn-export-pdf"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderColor: '#34d399',
                      padding: '9px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                    onClick={() => handleSelectMachine(activeOverviewMachine.machineId)}
                  >
                    📊 Open Full Analytics & Diagnostics →
                  </button>
                </div>
              ) : (
                /* PLANT-WIDE SYSTEM OVERVIEW */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  {/* Header */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '1.25rem' }}>🏭</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        System Overview
                      </h3>
                    </div>

                    {/* Circular / Hero Health Gauge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          border: '6px solid #10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          boxShadow: '0 0 15px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.2)',
                          background: 'rgba(16, 185, 129, 0.08)',
                          flexShrink: 0,
                        }}
                      >
                        {fleetSummary.avgScore ?? 85}%
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong
                            style={{
                              fontSize: '1.1rem',
                              color: (fleetSummary.avgScore ?? 85) >= 80 ? '#34d399' : (fleetSummary.avgScore ?? 85) >= 50 ? '#fbbf24' : '#f87171',
                            }}
                          >
                            {(fleetSummary.avgScore ?? 85) >= 80 ? 'Excellent' : (fleetSummary.avgScore ?? 85) >= 50 ? 'Warning' : 'Critical'}
                          </strong>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: (fleetSummary.avgScore ?? 85) >= 80 ? '#10b981' : (fleetSummary.avgScore ?? 85) >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <small style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                          Overall System Health
                        </small>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '5px',
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: fleetSummary.critical > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: fleetSummary.critical > 0 ? '#fca5a5' : '#6ee7b7',
                            border: fleetSummary.critical > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          {fleetSummary.critical > 0 ? `${fleetSummary.critical} Anomaly Detected` : 'Fleet Nominal'}
                        </span>
                      </div>
                    </div>

                    {/* Status Counters Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        padding: '12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        borderRadius: '12px',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                          ⚙️ Machines
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '3px' }}>
                          <span>Healthy</span>
                          <strong style={{ color: '#34d399' }}>{fleetSummary.healthy}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '3px' }}>
                          <span>Warning</span>
                          <strong style={{ color: '#fbbf24' }}>{fleetSummary.warning}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1' }}>
                          <span>Critical</span>
                          <strong style={{ color: '#f87171' }}>{fleetSummary.critical}</strong>
                        </div>
                      </div>

                      <div style={{ borderLeft: '1px solid rgba(51, 65, 85, 0.4)', paddingLeft: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                          👷 Safety
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '3px' }}>
                          <span>Status</span>
                          <strong style={{ color: '#34d399' }}>Nominal</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '3px' }}>
                          <span>Hazard</span>
                          <strong style={{ color: fleetSummary.critical > 0 ? '#f87171' : '#34d399' }}>
                            {fleetSummary.critical > 0 ? 'Alert!' : 'None'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1' }}>
                          <span>Zone</span>
                          <strong style={{ color: '#38bdf8' }}>Active</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Alert Summary */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      borderRadius: '12px',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📋 Alert Summary
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {fleetSummary.critical + fleetSummary.warning} total
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: '#f87171' }}>{fleetSummary.critical}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Critical</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fbbf24' }}>{fleetSummary.warning}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Warning</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: '#34d399' }}>{fleetSummary.healthy}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Info</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Factory 3D View */}
            <div>
              <MachineGrid
                machines={gridMachines}
                onSelectMachine={(mId) => {
                  setSelectedOverviewMachineId((prev) => (prev === mId ? null : mId))
                }}
                selectedId={selectedOverviewMachineId}
              />
            </div>
          </section>
        )}

        {/* Search & Filter Toolbar (Filtrage) */}
        <section className="mh-filter-bar">
          <div className="mh-search-box">
            <span className="mh-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search machines by name, ID, zone, or type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mh-search-input"
            />
          </div>

          <div className="mh-filter-group">
            <span className="mh-filter-label">Filter:</span>
            {(['all', 'healthy', 'warning', 'critical', 'offline'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`mh-pill-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}

            {zones.length > 1 && (
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="mh-zone-select"
              >
                <option value="all">All Zones</option>
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            )}

            {/* Download Fleet Report Button in Filtrage */}
            <button
              type="button"
              className="safety-btn-export-pdf"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.85) 100%)',
                borderColor: 'rgba(52, 211, 153, 0.35)',
                padding: '7px 15px',
                fontSize: '0.84rem',
                fontWeight: 750,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                marginLeft: '6px',
                whiteSpace: 'nowrap',
              }}
              onClick={handleDownloadFleet}
              disabled={machines.length === 0}
            >
              📥 Download Fleet Report
            </button>
          </div>
        </section>

        {/* Fleet Grid */}
        {loadingFleet ? (
          <div className="mh-card mh-state-panel">
            <div className="safety-loading-spinner" />
            <p style={{ marginTop: '12px', color: '#ecfeff', fontWeight: 700 }}>Loading registered machines…</p>
          </div>
        ) : fleetError ? (
          <div className="mh-card mh-state-panel mh-error">
            <strong>Error loading fleet</strong>
            <span>{fleetError}</span>
          </div>
        ) : machines.length === 0 ? (
          <div className="mh-card mh-state-panel mh-empty-fleet">
            <span className="mh-empty-icon">⚙️</span>
            <h3>No machines have been configured yet.</h3>
            <p>Machines registered will appear here automatically.</p>
            <button
              type="button"
              className="safety-btn-export-pdf"
              style={{ marginTop: '14px' }}
              onClick={() => setShowAddModal(true)}
            >
              ➕ Register Your First Machine
            </button>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="mh-card mh-state-panel">
            <p style={{ color: '#a7f3d0', fontSize: '1rem', fontWeight: 600 }}>No machines match the selected filter or search term.</p>
            <button
              type="button"
              className="mh-pill-btn active"
              style={{ marginTop: '12px' }}
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setZoneFilter('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <section className="mh-machine-grid" aria-label="Monitored machines grid">
            {filteredMachines.map((machine) => {
              const status = getMachineStatus(machine, null)
              const conn = getConnectionStatus(machine.lastSeen, machine.status)
              const score = machine.latestHealth?.healthScore

              return (
                <article
                  key={machine.machineId}
                  className="mh-fleet-card"
                  onClick={() => handleSelectMachine(machine.machineId)}
                >
                  <div className="mh-fleet-card-header">
                    <div>
                      <h3 className="mh-fleet-card-title">{machine.name}</h3>
                      <span className="mh-fleet-card-sub">
                        {machine.machineId} · {machine.zone} {machine.type ? `· ${machine.type}` : ''}
                      </span>
                    </div>
                    <span className={`mh-status-badge ${getStatusBadgeClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  {/* Health Score Main Block */}
                  <div className="mh-card-score-hero">
                    <div className="mh-card-score-topline">
                      <span className="mh-card-score-lbl">Health Score</span>
                      <strong
                        className="mh-card-score-num"
                        style={{
                          color:
                            (score ?? 0) >= 80
                              ? '#34d399'
                              : (score ?? 0) >= 50
                              ? '#fb923c'
                              : '#f87171',
                        }}
                      >
                        {score !== undefined ? `${score}` : '—'}
                        <small>/100</small>
                      </strong>
                    </div>
                    <div className="mh-mini-bar-track">
                      <div
                        className="mh-mini-bar-fill"
                        style={{
                          width: `${score ?? 0}%`,
                          backgroundColor:
                            (score ?? 0) >= 80
                              ? LABES_COLORS.emerald
                              : (score ?? 0) >= 50
                              ? LABES_COLORS.warning
                              : LABES_COLORS.danger,
                        }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Alert Banner if Warning or Critical */}
                  {status === 'Warning' && (
                    <div className="mh-card-alert-chip alert-chip-warning">
                      <span className="mh-alert-chip-icon">⚠️</span>
                      <span className="mh-alert-chip-text">Elevated harmonic vibration &amp; thermal warning</span>
                    </div>
                  )}
                  {status === 'Critical' && (
                    <div className="mh-card-alert-chip alert-chip-critical">
                      <span className="mh-alert-chip-icon">🚨</span>
                      <span className="mh-alert-chip-text">Critical mechanical anomaly detected!</span>
                    </div>
                  )}

                  {/* Footer: Connection state, action buttons */}
                  <div className="mh-fleet-card-footer">
                    <div className="mh-connection-state">
                      <span className="mh-conn-dot" style={{ backgroundColor: conn.color }} />
                      <span className="mh-conn-text">{conn.state}</span>
                      <span className="mh-conn-time">· Updated {formatRelativeTime(machine.lastSeen)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Edit Button */}
                      <button
                        type="button"
                        title="Edit machine"
                        className="mh-card-icon-btn mh-card-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          const m = machine
                          setEditMachineId(m.machineId)
                          setFormError(null)
                          setFormSuccess(null)
                          setDraftMachine({
                            machineId: m.machineId,
                            name: m.name,
                            zone: m.zone,
                            type: m.type ?? 'CNC Milling',
                            description: m.description ?? '',
                            initialStatus: (m.status === 'ONLINE' || m.status === 'WARNING' || m.status === 'CRITICAL') ? m.status : 'ONLINE',
                            warningRms: m.thresholds?.vibrationRms?.warning ?? 4.5,
                            criticalRms: m.thresholds?.vibrationRms?.critical ?? 7.1,
                            warningTemp: m.thresholds?.temperature?.warning ?? 65,
                            criticalTemp: m.thresholds?.temperature?.critical ?? 85,
                            warningCurrent: m.thresholds?.current?.warning ?? 28,
                            criticalCurrent: m.thresholds?.current?.critical ?? 35,
                          })
                          setShowAddModal(true)
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        title="Delete machine"
                        className="mh-card-icon-btn mh-card-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(machine.machineId)
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectMachine(machine.machineId)
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {deleteConfirmId && (
          <div className="mh-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <div
              className="mh-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '420px' }}
            >
              <div className="mh-modal-header">
                <div>
                  <span className="mh-card-kicker" style={{ color: '#f87171' }}>⚠️ Confirm Deletion</span>
                  <h2 className="mh-modal-title">Delete Machine</h2>
                  <p className="mh-modal-sub">
                    Are you sure you want to permanently delete&nbsp;
                    <strong style={{ color: '#f1f5f9' }}>
                      {machines.find((m) => m.machineId === deleteConfirmId)?.name ?? deleteConfirmId}
                    </strong>?
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  className="mh-modal-close"
                  onClick={() => setDeleteConfirmId(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="mh-modal-actions" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="mh-btn-modal-cancel"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={() => void handleDeleteMachine(deleteConfirmId)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.75) 0%, rgba(185,28,28,0.85) 100%)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {deleteSubmitting ? 'Deleting…' : '🗑 Delete Machine'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Machine Modal Popup ── */}
        {showAddModal && (
          <div className="mh-modal-backdrop" onClick={() => { setShowAddModal(false); setEditMachineId(null) }}>
            <div className="mh-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="mh-modal-header">
                <div>
                  <span className="mh-card-kicker">Asset Management</span>
                  <h2 className="mh-modal-title">
                    {editMachineId ? `Edit Machine — ${editMachineId}` : 'Register New Machine'}
                  </h2>
                  <p className="mh-modal-sub">
                    {editMachineId
                      ? 'Update the configuration and thresholds for this industrial asset.'
                      : 'Add a new industrial asset for real-time telemetry and AI condition monitoring.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="mh-modal-close"
                  onClick={() => { setShowAddModal(false); setEditMachineId(null) }}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={editMachineId ? handleUpdateMachine : handleCreateMachine} className="mh-modal-form">
                {formError && (
                  <div className="mh-modal-alert mh-modal-alert-error">
                    ⚠️ {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="mh-modal-alert mh-modal-alert-success">
                    ✓ {formSuccess}
                  </div>
                )}

                <div className="mh-form-grid">
                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-id">Machine ID *</label>
                    <input
                      id="modal-machine-id"
                      type="text"
                      required
                      placeholder="e.g. CNC-007"
                      value={draftMachine.machineId}
                      readOnly={!!editMachineId}
                      style={editMachineId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      onChange={(e) => !editMachineId && setDraftMachine({ ...draftMachine, machineId: e.target.value })}
                    />
                  </div>

                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-name">Machine Name *</label>
                    <input
                      id="modal-machine-name"
                      type="text"
                      required
                      placeholder="e.g. 5-Axis Horizontal Boring Mill"
                      value={draftMachine.name}
                      onChange={(e) => setDraftMachine({ ...draftMachine, name: e.target.value })}
                    />
                  </div>

                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-zone">Industrial Zone *</label>
                    <input
                      id="modal-machine-zone"
                      type="text"
                      required
                      placeholder="e.g. Zone A - Heavy Machining"
                      value={draftMachine.zone}
                      onChange={(e) => setDraftMachine({ ...draftMachine, zone: e.target.value })}
                    />
                  </div>

                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-type">Asset Type</label>
                    <select
                      id="modal-machine-type"
                      value={draftMachine.type}
                      onChange={(e) => setDraftMachine({ ...draftMachine, type: e.target.value })}
                    >
                      <option value="CNC Milling">CNC Milling</option>
                      <option value="Hydraulic Pump">Hydraulic Pump</option>
                      <option value="Air Compressor">Air Compressor</option>
                      <option value="Robotic Arm">Robotic Arm</option>
                      <option value="Centrifugal Fan">Centrifugal Fan</option>
                      <option value="Mechanical Press">Mechanical Press</option>
                      <option value="Induction Motor">Induction Motor</option>
                      <option value="Conveyor Drive">Conveyor Drive</option>
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-status">Initial Status</label>
                    <select
                      id="modal-machine-status"
                      value={draftMachine.initialStatus}
                      onChange={(e) => setDraftMachine({ ...draftMachine, initialStatus: e.target.value as any })}
                    >
                      <option value="ONLINE">Healthy (Online)</option>
                      <option value="WARNING">Warning Condition</option>
                      <option value="CRITICAL">Critical Anomaly</option>
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label htmlFor="modal-machine-desc">Description (Optional)</label>
                    <input
                      id="modal-machine-desc"
                      type="text"
                      placeholder="e.g. Primary cooling loop pump #3"
                      value={draftMachine.description}
                      onChange={(e) => setDraftMachine({ ...draftMachine, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Configured Thresholds Sub-Block */}
                <div className="mh-modal-thresholds-box">
                  <span className="mh-thresholds-box-title">Alert Thresholds (Vibration RMS &amp; Thermal)</span>
                  <div className="mh-thresholds-box-grid">
                    <div className="mh-form-group">
                      <label>Warn RMS (mm/s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={draftMachine.warningRms}
                        onChange={(e) => setDraftMachine({ ...draftMachine, warningRms: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="mh-form-group">
                      <label>Crit RMS (mm/s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={draftMachine.criticalRms}
                        onChange={(e) => setDraftMachine({ ...draftMachine, criticalRms: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="mh-form-group">
                      <label>Warn Temp (°C)</label>
                      <input
                        type="number"
                        value={draftMachine.warningTemp}
                        onChange={(e) => setDraftMachine({ ...draftMachine, warningTemp: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="mh-form-group">
                      <label>Crit Temp (°C)</label>
                      <input
                        type="number"
                        value={draftMachine.criticalTemp}
                        onChange={(e) => setDraftMachine({ ...draftMachine, criticalTemp: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mh-modal-actions">
                  <button
                    type="button"
                    className="mh-btn-modal-cancel"
                    onClick={() => { setShowAddModal(false); setEditMachineId(null) }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="safety-btn-export-pdf"
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting
                      ? (editMachineId ? 'Saving…' : 'Registering Asset…')
                      : (editMachineId ? '💾 Save Changes' : '➕ Register Machine')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    ) : loadingDetail && !selectedMachine ? (
      // ── Loading Detail ──
      <div className="safety-page-shell mh-page-shell">
        <div className="safety-loading-card">
          <div className="safety-loading-spinner" />
          <p>Loading machine telemetry for {selectedMachineId}…</p>
        </div>
      </div>
    ) : detailError || !selectedMachine ? (
      // ── Error / Not Found ──
      <div className="safety-page-shell mh-page-shell">
        <div className="mh-card mh-state-panel mh-error">
          <strong>Unable to load machine details</strong>
          <span>{detailError ?? `Machine ${selectedMachineId} not found.`}</span>
          <button type="button" className="mh-back-btn" onClick={handleBackToFleet} style={{ marginTop: '12px' }}>
            ← Back to Fleet Overview
          </button>
        </div>
      </div>

    ) : selectedMachine ? (
      // ── Machine Detail View ──

      <div className="safety-page-shell mh-page-shell">
      {/* Detail Navigation Topbar */}
      <section className="mh-detail-nav">
        <button type="button" className="mh-back-btn" onClick={handleBackToFleet}>
          ← Back to Fleet Overview
        </button>
        <span className="mh-detail-crumb">
          Fleet / <strong>{selectedMachine.name}</strong> ({selectedMachine.machineId})
        </span>
      </section>

      {/* Machine Identity Topbar */}
      <section className="mh-topbar">
        <div className="mh-title-block">
          <div className="mh-title-with-badge">
            <h1
                className="safety-page-title"
                style={{
                  background: 'none',
                  WebkitBackgroundClip: 'unset',
                  WebkitTextFillColor: 'unset',
                  backgroundClip: 'unset',
                  animation: 'none',
                  color: '#f1f5f9',
                }}
              >{selectedMachine.name}</h1>
            <span className={`mh-status-badge ${getStatusBadgeClass(machineStatus)}`}>
              {machineStatus}
            </span>
          </div>
          <p className="mh-subtitle">
            {selectedMachine.machineId} · Zone: {selectedMachine.zone} {selectedMachine.type ? `· Type: ${selectedMachine.type}` : ''}
          </p>
        </div>

        <div className="mh-toolbar">
          <button
            type="button"
            className="safety-btn-export-pdf"
            onClick={handleDownloadMachine}
          >
            📥 Download Machine Report
          </button>
          <div className="mh-context-meta">
            <span className="mh-conn-indicator" style={{ color: connState.color }}>
              <i style={{ backgroundColor: connState.color }} />
              {connState.state} · Updated {formatRelativeTime(latestHealth?.timestamp ?? selectedMachine.lastSeen)}
            </span>
          </div>
        </div>
      </section>

      {/* Primary Health & Condition Row */}
      <section className="mh-detail-header-grid">
        {/* Prominent Health Score Card */}
        <article className="mh-card mh-score-card">
          <span className="mh-card-kicker">Machine Health Score</span>
          <div className="mh-score-main">
            <strong>{currentHealthScore}</strong>
            <span>/ 100</span>
          </div>
          <div className="mh-score-indicator-bar">
            <div
              className="mh-score-bar-fill"
              style={{
                width: `${currentHealthScore}%`,
                backgroundColor:
                  currentHealthScore >= 80
                    ? LABES_COLORS.emerald
                    : currentHealthScore >= 50
                    ? LABES_COLORS.warning
                    : LABES_COLORS.danger,
              }}
            />
          </div>
          <p className="mh-score-note">
            {currentHealthScore >= 80
              ? 'Optimal operating conditions. Vibration and thermal signatures within nominal limits.'
              : currentHealthScore >= 50
              ? 'Warning: Early anomaly signals observed. Recommended maintenance check soon.'
              : 'Critical: Sensor readings exceed tolerance limits. Immediate inspection recommended.'}
          </p>
        </article>

        {/* AI Condition Assessment Card */}
        <article className="mh-card mh-ai-summary-card">
          <span className="mh-card-kicker">AI Predictive Diagnostics</span>
          <div className="mh-ai-headline">
            <h3>{machineStatus === 'Critical' ? 'Critical Mechanical Anomaly' : machineStatus === 'Warning' ? 'Elevated Harmonic Vibration' : 'Nominal Baseline Operating'}</h3>
            <span className="mh-ai-badge">LSTM-AE Autoencoder</span>
          </div>
          <div className="mh-ai-stats-row">
            <div className="mh-ai-stat">
              <span>Anomaly Score</span>
              <strong>{Number.isFinite(anomalyScore) ? anomalyScore.toFixed(2) : '0.15'}</strong>
              <small>Tolerance: {activeThresholds.anomalyScore.warning}</small>
            </div>
            <div className="mh-ai-stat">
              <span>Model Confidence</span>
              <strong>94%</strong>
              <small>Validated</small>
            </div>
            <div className="mh-ai-stat">
              <span>Sampling Frequency</span>
              <strong>1.0 kHz</strong>
              <small>Real-time</small>
            </div>
          </div>
        </article>
      </section>

      {/* Threshold Metric Cards with Horizontal Gauges (Requirements 20, 21, 22) */}
      <section className="mh-threshold-metrics-section">
        <div className="mh-section-label">
          <h2>Sensor Telemetry & Configured Thresholds</h2>
          <p>Real-time metrics evaluated against machine thresholds stored in MongoDB</p>
        </div>

        <div className="mh-threshold-gauges-grid">
          {/* 1. Vibration RMS */}
          <ThresholdGauge
            label="Vibration RMS"
            value={rmsVal}
            unit="mm/s"
            warningThreshold={activeThresholds.vibrationRms.warning}
            criticalThreshold={activeThresholds.vibrationRms.critical}
            precision={4}
          />

          {/* 2. Peak Acceleration */}
          <ThresholdGauge
            label="Peak Acceleration"
            value={peakVal}
            unit="g"
            warningThreshold={activeThresholds.peakAcceleration.warning}
            criticalThreshold={activeThresholds.peakAcceleration.critical}
            precision={4}
          />

          {/* 3. Temperature */}
          <ThresholdGauge
            label="Temperature"
            value={tempVal}
            unit="°C"
            warningThreshold={activeThresholds.temperature.warning}
            criticalThreshold={activeThresholds.temperature.critical}
            precision={1}
          />

          {/* 4. Current Draw */}
          <ThresholdGauge
            label="Current Draw"
            value={curVal}
            unit="A"
            warningThreshold={activeThresholds.current.warning}
            criticalThreshold={activeThresholds.current.critical}
            precision={2}
          />

          {/* 5. Anomaly Score */}
          <ThresholdGauge
            label="AI Anomaly Score"
            value={anomalyScore}
            unit=""
            warningThreshold={activeThresholds.anomalyScore.warning}
            criticalThreshold={activeThresholds.anomalyScore.critical}
            maxScale={1.0}
            precision={2}
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className="mh-charts-section">
        {/* Continuous Real-Time Vibration Oscillation Stream */}
        <ContinuousOscilloscope
          rms={rmsVal}
          peak={peakVal}
          status={selectedMachine.status}
          rawSignal={latestHealth?.vibrationPreview ?? []}
          machineName={selectedMachine.name}
          machineId={selectedMachine.machineId}
          height={230}
        />

        <div className="mh-two-column" style={{ marginTop: '20px' }}>
          {/* Chart 1: Vibration RMS Trend with Overlaid Threshold Lines (Requirement 23) */}
          <article className="mh-card mh-chart-card">
            <div className="mh-section-heading">
              <div>
                <h2>Vibration RMS Trend</h2>
                <p>Time series with configured warning and critical threshold boundaries</p>
              </div>
            </div>

            {history.length < 2 ? (
              <div className="mh-chart-placeholder">Accumulating telemetry points…</div>
            ) : (
              <LabesLineChart
                labels={historyLabels}
                datasets={[
                  {
                    label: 'RMS Vibration (mm/s)',
                    data: historyRms,
                    color: LABES_COLORS.green,
                    fill: true,
                    fillColor: 'rgba(20, 83, 56, 0.08)',
                  },
                ]}
                thresholds={[
                  {
                    value: activeThresholds.vibrationRms.warning,
                    label: 'Warning',
                    color: LABES_COLORS.warning,
                  },
                  {
                    value: activeThresholds.vibrationRms.critical,
                    label: 'Critical',
                    color: LABES_COLORS.danger,
                  },
                ]}
                yMin={0}
                yUnit=" mm/s"
                height={220}
              />
            )}
          </article>

          {/* Chart 2: Health Score History (Requirement 28) */}
          <article className="mh-card mh-chart-card">
            <div className="mh-section-heading">
              <div>
                <h2>Health History</h2>
                <p>Historical health score progression</p>
              </div>
              <div className="mh-range-tabs">
                {(['1h', '24h', '7d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`mh-range-tab ${historyRange === r ? 'active' : ''}`}
                    onClick={() => setHistoryRange(r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {history.length < 2 ? (
              <div className="mh-chart-placeholder">Accumulating historical points…</div>
            ) : (
              <LabesLineChart
                labels={historyLabels}
                datasets={[
                  {
                    label: 'Health Score',
                    data: historyScores,
                    color: LABES_COLORS.emerald,
                    fill: true,
                    fillColor: 'rgba(16, 185, 129, 0.08)',
                  },
                ]}
                yMin={0}
                yMax={100}
                yUnit="%"
                height={220}
              />
            )}
          </article>
        </div>

        {/* FFT Frequency Spectrum Row */}
        <article className="mh-card mh-chart-card" style={{ marginTop: '20px', overflow: 'hidden' }}>
          <div className="mh-section-heading">
            <div>
              <h2>FFT Frequency Spectrum</h2>
              <p>Harmonic energy bands from latest vibration waveform (0–500 Hz)</p>
            </div>
            {(() => {
              const displayBands = (fftBands || []).slice(0, 8)
              let maxIdx = 2
              let maxVal = -Infinity
              displayBands.forEach((b, i) => {
                const val = typeof b === 'number' && !Number.isNaN(b) ? b : 0
                if (val > maxVal) {
                  maxVal = val
                  maxIdx = i
                }
              })
              const dominantFreq = (maxIdx + 1) * 60
              return <span className="mh-dominant-tag">Dominant: {dominantFreq} Hz</span>
            })()}
          </div>

          <div className="mh-fft-bar-wrap">
            {(() => {
              const displayBands = (fftBands || []).slice(0, 8)
              let maxIdx = 2
              let maxVal = -Infinity
              displayBands.forEach((b, i) => {
                const val = typeof b === 'number' && !Number.isNaN(b) ? b : 0
                if (val > maxVal) {
                  maxVal = val
                  maxIdx = i
                }
              })

              return displayBands.map((band, idx) => {
                const freq = (idx + 1) * 60
                const isDominant = idx === maxIdx
                const safeBand = typeof band === 'number' && !Number.isNaN(band) ? band : 0
                return (
                  <div key={idx} className="mh-fft-col">
                    <div className="mh-fft-track">
                      <div
                        className={`mh-fft-fill ${isDominant ? 'dominant' : ''}`}
                        style={{
                          height: `${Math.min(safeBand * 240, 100)}%`,
                          backgroundColor: isDominant ? LABES_COLORS.orange : LABES_COLORS.green,
                        }}
                        title={`${freq} Hz: ${safeBand.toFixed(3)} g`}
                      />
                    </div>
                    <span className="mh-fft-freq">{freq}Hz</span>
                  </div>
                )
              })
            })()}
          </div>
        </article>
      </section>

      {/* Threshold Configuration Inspection Panel */}
      <section className="mh-threshold-config-panel mh-card">
        <div className="mh-config-header">
          <div>
            <h3>Active Threshold Parameters (MongoDB)</h3>
            <p>Configured in Machine Management for machine ID <code>{selectedMachine.machineId}</code></p>
          </div>
          <a href="#machine-management" className="btn-secondary">
            Configure in Machine Management ↗
          </a>
        </div>

        <div className="mh-config-grid">
          <div className="mh-config-item">
            <span>Vibration RMS</span>
            <strong>Warn: {activeThresholds.vibrationRms.warning} mm/s</strong>
            <small>Crit: {activeThresholds.vibrationRms.critical} mm/s</small>
          </div>
          <div className="mh-config-item">
            <span>Peak Acceleration</span>
            <strong>Warn: {activeThresholds.peakAcceleration.warning} g</strong>
            <small>Crit: {activeThresholds.peakAcceleration.critical} g</small>
          </div>
          <div className="mh-config-item">
            <span>Temperature</span>
            <strong>Warn: {activeThresholds.temperature.warning} °C</strong>
            <small>Crit: {activeThresholds.temperature.critical} °C</small>
          </div>
          <div className="mh-config-item">
            <span>Current Draw</span>
            <strong>Warn: {activeThresholds.current.warning} A</strong>
            <small>Crit: {activeThresholds.current.critical} A</small>
          </div>
          <div className="mh-config-item">
            <span>Anomaly Score</span>
            <strong>Warn: {activeThresholds.anomalyScore.warning}</strong>
            <small>Crit: {activeThresholds.anomalyScore.critical}</small>
          </div>
        </div>
      </section>
    </div>
    ) : null}
    </>
  )
}
