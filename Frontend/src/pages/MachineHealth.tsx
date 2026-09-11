import { useEffect, useMemo, useState } from 'react'
import { AIConditionAssessment } from '../components/machine-health/AIConditionAssessment'
import { FrequencySpectrum } from '../components/machine-health/FrequencySpectrum'
import { HealthHistory } from '../components/machine-health/HealthHistory'
import { HealthScoreCard } from '../components/machine-health/HealthScoreCard'
import { MachineDetails } from '../components/machine-health/MachineDetails'
import { MachineSelector } from '../components/machine-health/MachineSelector'
import { MetricCard } from '../components/machine-health/MetricCard'
import { RecentMachineAlerts } from '../components/machine-health/RecentMachineAlerts'
import { StatusBadge } from '../components/machine-health/StatusBadge'
import { VibrationChart } from '../components/machine-health/VibrationChart'
import { machineHealthMockService } from '../services/machineHealthMockService'
import type {
  HistoryRange,
  Machine,
  MachineHealthStatus,
  MachineHealthViewModel,
} from '../types/machineHealth'

const machineHealthService = machineHealthMockService

function timeAgo(value: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds} sec ago`
  const minutes = Math.round(seconds / 60)
  return `${minutes} min ago`
}

export function MachineHealth() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState('motor-01')
  const [scenario, setScenario] = useState<MachineHealthStatus>('red')
  const [range, setRange] = useState<HistoryRange>('1h')
  const [data, setData] = useState<MachineHealthViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMachineHealth() {
      setLoading(true)
      setError(null)

      try {
        const loadedMachines = await machineHealthService.getMachines()
        const loadedData = await machineHealthService.getMachineHealth(selectedMachineId, scenario)

        if (!cancelled) {
          setMachines(loadedMachines)
          setData(loadedData)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load Machine Health data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMachineHealth()

    return () => {
      cancelled = true
    }
  }, [scenario, selectedMachineId])

  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.id === selectedMachineId) ?? data?.machine,
    [data?.machine, machines, selectedMachineId],
  )

  if (loading && !data) {
    return (
      <div className="mh-page">
        <div className="mh-card mh-state-panel">Loading Machine Health...</div>
      </div>
    )
  }

  if (error || !data || !selectedMachine) {
    return (
      <div className="mh-page">
        <div className="mh-card mh-state-panel mh-error">
          <strong>Unable to load Machine Health</strong>
          <span>{error ?? 'No machine-health data available.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mh-page">
      <section className="mh-topbar">
        <div className="mh-title-block">
          <h1>Machine Health</h1>
          <p>Predictive maintenance and real-time condition monitoring</p>
        </div>
        <div className="mh-toolbar">
          <MachineSelector machines={machines} selectedMachineId={selectedMachineId} onChange={setSelectedMachineId} />
          <div className="mh-context-meta">
            <span>{data.machine.zone} · {data.machine.machineId}</span>
            <strong className={data.machine.connected ? 'connected' : 'offline'}>
              <i></i>{data.machine.connected ? 'Connected' : 'Offline'} · Updated {timeAgo(data.machine.lastSeen)}
            </strong>
          </div>
        </div>
      </section>

      {import.meta.env.DEV && (
        <section className="mh-dev-control" aria-label="Development mock state selector">
          <label>
            <span>DEV MOCK STATE</span>
            <select value={scenario} onChange={(event) => setScenario(event.target.value as MachineHealthStatus)}>
              <option value="green">Healthy</option>
              <option value="yellow">Warning</option>
              <option value="red">Critical</option>
            </select>
          </label>
        </section>
      )}

      <section className="mh-summary-grid">
        <HealthScoreCard snapshot={data.snapshot} />
        <div className="mh-metric-grid">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      <section className="mh-analysis-section">
        <div className="mh-section-label">
          <h2>Signal Analysis</h2>
          <p>Sensor vibration → RMS / Peak / FFT → AI health score</p>
        </div>
        <div className="mh-two-column">
          <VibrationChart values={data.snapshot.vibrationSignal} />
          <FrequencySpectrum
            spectrum={data.snapshot.fftSpectrum}
            dominantFrequency={data.snapshot.dominantFrequency}
            dominantAmplitude={data.snapshot.dominantAmplitude}
          />
        </div>
      </section>

      <section className="mh-ai-section">
        <AIConditionAssessment snapshot={data.snapshot} drivers={data.drivers} />
      </section>

      <section className="mh-history-section">
        <div className="mh-two-column mh-history-grid">
          <HealthHistory points={data.history[range]} range={range} onRangeChange={setRange} />
          <RecentMachineAlerts alerts={data.alerts} />
        </div>
      </section>

      <section className="mh-bottom-section">
        <MachineDetails machine={data.machine} snapshot={data.snapshot} />
        <article className="mh-card mh-operator-card">
          <div>
            <span className="mh-card-kicker">Operator Focus</span>
            <h2>Look first at vibration and temperature trends.</h2>
          </div>
          <p>{data.snapshot.explanation}</p>
          <StatusBadge status={data.snapshot.status} />
        </article>
      </section>
    </div>
  )
}
