import type { MachineHealthStatus, MetricSeverity } from '../../types/machineHealth'

export function statusText(status: MachineHealthStatus): 'Healthy' | 'Warning' | 'Critical' {
  if (status === 'green') return 'Healthy'
  if (status === 'yellow') return 'Warning'
  return 'Critical'
}

export function StatusBadge({ status }: { status: MachineHealthStatus }) {
  return <span className={`mh-status-badge mh-status-${status}`}>{statusText(status)}</span>
}

export function SeverityBadge({ severity }: { severity: MetricSeverity }) {
  return <span className={`mh-severity-badge severity-${severity.toLowerCase()}`}>{severity}</span>
}
