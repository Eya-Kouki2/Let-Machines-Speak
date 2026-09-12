import type { MachineAlert } from '../../types/machineHealth'

export function RecentMachineAlerts({ alerts }: { alerts: MachineAlert[] }) {
  return (
    <article className="mh-card mh-alerts-card">
      <div className="mh-section-heading">
        <div>
          <h2>Recent Alerts</h2>
          <p>Latest machine-health events</p>
        </div>
      </div>
      <div className="mh-alert-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`mh-alert-row alert-${alert.severity}`}>
            <span>{alert.severity}</span>
            <strong>{alert.title}</strong>
            <small>{alert.timeAgo}</small>
          </div>
        ))}
      </div>
    </article>
  )
}
