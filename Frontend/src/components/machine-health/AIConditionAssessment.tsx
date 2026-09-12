import type { HealthDriver, MachineHealthSnapshot } from '../../types/machineHealth'
import { SeverityBadge, StatusBadge } from './StatusBadge'

export function AIConditionAssessment({ snapshot, drivers }: { snapshot: MachineHealthSnapshot; drivers: HealthDriver[] }) {
  return (
    <article className="mh-card mh-ai-card">
      <div className="mh-section-heading">
        <div>
          <h2>AI Condition Assessment</h2>
          <p>{snapshot.detectedCondition}</p>
        </div>
        <StatusBadge status={snapshot.status} />
      </div>
      <div className="mh-ai-grid">
        <div>
          <span className="mh-card-kicker">Health Score</span>
          <strong>{snapshot.healthScore} / 100</strong>
        </div>
        <div>
          <span className="mh-card-kicker">Model Confidence</span>
          <strong>{snapshot.confidence}%</strong>
        </div>
        <div>
          <span className="mh-card-kicker">AI Model</span>
          <strong>{snapshot.aiModel}</strong>
        </div>
      </div>
      <div className="mh-driver-list">
        {drivers.map((driver) => (
          <div key={driver.label} className="mh-driver-row">
            <span>{driver.label}</span>
            <SeverityBadge severity={driver.severity} />
            <small>{driver.detail}</small>
          </div>
        ))}
      </div>
    </article>
  )
}
