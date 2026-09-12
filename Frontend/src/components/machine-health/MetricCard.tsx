import type { MachineMetric } from '../../types/machineHealth'
import { deltaText } from '../../services/machineHealth.mock'
import { SeverityBadge } from './StatusBadge'

export function MetricCard({ metric }: { metric: MachineMetric }) {
  return (
    <article className="mh-card mh-compact-metric">
      <div className="mh-metric-topline">
        <span>{metric.label}</span>
        <SeverityBadge severity={metric.severity} />
      </div>
      <strong>
        {metric.value.toFixed(metric.unit === '°C' ? 1 : 2)}
        <small>{metric.unit}</small>
      </strong>
      <div className="mh-baseline-row">
        <span>Baseline {metric.baseline.toFixed(metric.unit === '°C' ? 0 : 2)}{metric.unit}</span>
        <span>{deltaText(metric)}</span>
      </div>
    </article>
  )
}
