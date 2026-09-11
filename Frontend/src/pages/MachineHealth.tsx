import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMachines,
  getMetrics,
  simulateMachineData,
} from '../services/machineHealthApi'
import type { AiHealthStatus, HealthRecord, Machine, MachineMetrics } from '../types/machineHealth'

function statusLabel(status: AiHealthStatus | undefined): string {
  if (status === 'green') return 'Healthy'
  if (status === 'yellow') return 'Warning'
  if (status === 'red') return 'Critical'
  return 'No Data'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'No update yet'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function LineChart({ values, label }: { values: number[]; label: string }) {
  const points = useMemo(() => {
    if (values.length === 0) return ''
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    return values
      .map((value, index) => {
        const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100
        const y = 90 - ((value - min) / range) * 80
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [values])

  if (!points) {
    return <div className="mh-state-card">No {label} data available yet</div>
  }

  return (
    <svg className="mh-line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline className="mh-chart-grid" points="0,50 100,50" />
      <polyline className="mh-chart-line" points={points} />
    </svg>
  )
}

function BarChart({ values, label }: { values: number[]; label: string }) {
  if (values.length === 0) {
    return <div className="mh-state-card">No {label} data available yet</div>
  }

  const max = Math.max(...values, 0.000001)

  return (
    <div className="mh-bar-chart" role="img" aria-label={label}>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="mh-bar"
          style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function MetricCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="mh-metric-card">
      <span className="mh-metric-label">{label}</span>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
    </div>
  )
}

function MachineSelector({
  machines,
  selectedMachineId,
  onChange,
}: {
  machines: Machine[]
  selectedMachineId: string
  onChange: (machineId: string) => void
}) {
  return (
    <select className="mh-machine-select" value={selectedMachineId} onChange={(event) => onChange(event.target.value)}>
      {machines.map((machine) => (
        <option key={machine.machineId} value={machine.machineId}>
          {machine.name}
        </option>
      ))}
    </select>
  )
}

function EmptyMachineState({ onSimulate }: { onSimulate: (scenario: 'HEALTHY') => void }) {
  return (
    <div className="mh-empty-shell">
      <div className="wip-icon-ring">
        <svg className="wip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      </div>
      <h1 className="wip-title">Machine Health</h1>
      <p className="wip-description">No machine health data available yet.</p>
      <button className="btn-go-dashboard" type="button" onClick={() => onSimulate('HEALTHY')}>
        Generate Healthy Simulation
      </button>
    </div>
  )
}

export function MachineHealth() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState('machine-01')
  const [metrics, setMetrics] = useState<MachineMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const seedDemoSeries = useCallback(async (machineId: string) => {
    const scenarios: Array<'HEALTHY' | 'WARNING' | 'CRITICAL'> = [
      'HEALTHY',
      'HEALTHY',
      'HEALTHY',
      'WARNING',
      'HEALTHY',
      'WARNING',
      'CRITICAL',
      'WARNING',
      'HEALTHY',
      'HEALTHY',
      'WARNING',
      'HEALTHY',
      'CRITICAL',
      'WARNING',
      'HEALTHY',
      'HEALTHY',
    ]

    for (const scenario of scenarios) {
      await simulateMachineData(scenario, machineId)
    }
  }, [])

  const loadData = useCallback(async (machineId = selectedMachineId) => {
    setLoading(true)
    setError(null)

    try {
      const loadedMachines = await getMachines()
      setMachines(loadedMachines)

      const nextMachineId = loadedMachines.some((machine) => machine.machineId === machineId)
        ? machineId
        : loadedMachines[0]?.machineId ?? machineId
      setSelectedMachineId(nextMachineId)

      if (loadedMachines.length > 0) {
        const loadedMetrics = await getMetrics(nextMachineId)

        if (loadedMetrics.history.length < 8) {
          await seedDemoSeries(nextMachineId)
          setMetrics(await getMetrics(nextMachineId))
        } else {
          setMetrics(loadedMetrics)
        }
      } else {
        await seedDemoSeries(nextMachineId)
        const seededMachines = await getMachines()
        setMachines(seededMachines)
        setMetrics(await getMetrics(nextMachineId))
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Machine Health data')
    } finally {
      setLoading(false)
    }
  }, [seedDemoSeries, selectedMachineId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const handleRealtimeUpdate = () => void loadData(selectedMachineId)
    window.addEventListener('machine-health:update', handleRealtimeUpdate)
    return () => window.removeEventListener('machine-health:update', handleRealtimeUpdate)
  }, [loadData, selectedMachineId])

  const latestHealth = metrics?.latestHealth ?? null
  const machine = metrics?.machine ?? machines.find((item) => item.machineId === selectedMachineId) ?? null

  const runSimulation = async (scenario: 'HEALTHY' | 'WARNING' | 'CRITICAL') => {
    setError(null)
    try {
      await simulateMachineData(scenario, selectedMachineId)
      await loadData(selectedMachineId)
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : 'Simulation failed')
    }
  }

  if (loading && !metrics) {
    return (
      <div className="mh-page">
        <div className="mh-state-card">Loading Machine Health...</div>
      </div>
    )
  }

  if (error && machines.length === 0) {
    return (
      <div className="mh-page">
        <div className="mh-state-card mh-error">
          <strong>Unable to load Machine Health</strong>
          <span>{error}</span>
          <button className="btn-go-dashboard" type="button" onClick={() => void runSimulation('HEALTHY')}>
            Try Simulation
          </button>
        </div>
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="mh-page">
        <EmptyMachineState onSimulate={runSimulation} />
      </div>
    )
  }

  return (
    <div className="mh-page">
      <section className="mh-header">
        <div>
          <div className="why-choose-badge">
            <span className="badge-dot"></span>
            MACHINE HEALTH
          </div>
          <h1>Machine Health</h1>
          <p>Predictive maintenance telemetry, AI scoring, and signal analysis.</p>
        </div>
        <MachineSelector machines={machines} selectedMachineId={selectedMachineId} onChange={(value) => void loadData(value)} />
      </section>

      {error && <div className="mh-state-card mh-error">{error}</div>}

      <section className="mh-machine-band">
        <div>
          <h2>{machine?.name ?? 'Unknown Machine'}</h2>
          <p>{machine?.zone ?? 'No zone assigned'}</p>
        </div>
        <span className={`mh-machine-status status-${machine?.status.toLowerCase() ?? 'offline'}`}>
          {machine?.status ?? 'OFFLINE'}
        </span>
      </section>

      <section className="mh-score-grid">
        <div className={`mh-health-score health-${latestHealth?.status ?? 'empty'}`}>
          <span>Health Score</span>
          <strong>{latestHealth?.healthScore ?? '--'}</strong>
          <small>{statusLabel(latestHealth?.status)}</small>
        </div>
        <MetricCard label="Temperature" value={latestHealth?.temperature ?? '--'} unit="°C" />
        <MetricCard label="Current" value={latestHealth?.current ?? '--'} unit="A" />
        <MetricCard label="RMS" value={latestHealth?.rms ?? '--'} />
        <MetricCard label="Peak" value={latestHealth?.peak ?? '--'} />
      </section>

      <section className="mh-simulation-row">
        <button type="button" className="btn-go-dashboard" onClick={() => void runSimulation('HEALTHY')}>
          Healthy
        </button>
        <button type="button" className="btn-safety-overview" onClick={() => void runSimulation('WARNING')}>
          Warning
        </button>
        <button type="button" className="mh-critical-btn" onClick={() => void runSimulation('CRITICAL')}>
          Critical
        </button>
      </section>

      <section className="mh-chart-grid-layout">
        <article className="mh-panel">
          <h2>Vibration Signal</h2>
          <LineChart values={latestHealth?.vibrationPreview ?? []} label="Vibration Signal" />
        </article>
        <article className="mh-panel">
          <h2>Frequency Spectrum</h2>
          <BarChart values={latestHealth?.fftBands ?? []} label="Frequency Spectrum" />
        </article>
      </section>

      <section className="mh-panel">
        <h2>Health History</h2>
        <LineChart values={metrics?.history.map((record: HealthRecord) => record.healthScore) ?? []} label="Health History" />
      </section>

      <section className="mh-info-grid">
        <MetricCard label="Last update" value={formatDate(latestHealth?.timestamp ?? machine?.lastSeen)} />
        <MetricCard label="Machine status" value={machine?.status ?? 'OFFLINE'} />
        <MetricCard label="AI status" value={latestHealth?.status.toUpperCase() ?? 'NO DATA'} />
        <MetricCard label="Sensor status" value={machine?.status === 'OFFLINE' ? 'Offline' : 'Streaming'} />
      </section>
    </div>
  )
}
