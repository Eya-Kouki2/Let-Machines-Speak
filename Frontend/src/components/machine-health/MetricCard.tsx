import type { MachineMetric } from '../../types/machineHealth'
import { deltaText } from '../../services/machineHealth.mock'
import { SeverityBadge } from './StatusBadge'

function safeMetricNumber(value: number | null | undefined, decimals: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A'
  return Number(value).toFixed(decimals)
}

export function MetricCard({ metric }: { metric: MachineMetric }) {
  const value = typeof metric.value === 'number' && Number.isFinite(metric.value) ? metric.value : null
  const baseline = typeof metric.baseline === 'number' && Number.isFinite(metric.baseline) ? metric.baseline : null
  const decimals = metric.unit === '°C' ? 1 : metric.key === 'rms' || metric.unit === 'mm/s' || metric.unit === 'g' ? 4 : 2

  return (
    <article className="mh-card mh-compact-metric">
      <div className="mh-metric-topline">
        <span>{metric.label}</span>
        <SeverityBadge severity={metric.severity} />
      </div>
      <strong>
        {safeMetricNumber(value, decimals)}
        <small>{metric.unit}</small>
      </strong>
      <div className="mh-baseline-row">
        <span>Baseline {safeMetricNumber(baseline, metric.unit === '°C' ? 0 : decimals)}{metric.unit}</span>
        <span>{deltaText(metric)}</span>
      </div>
    </article>
  )
}
