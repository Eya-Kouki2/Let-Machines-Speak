import type { MachineHealthSnapshot } from '../../types/machineHealth'
import { StatusBadge } from './StatusBadge'

export function HealthScoreCard({ snapshot }: { snapshot: MachineHealthSnapshot }) {
  return (
    <article className="mh-card mh-score-card">
      <div className="mh-card-kicker">Health Score</div>
      <div className="mh-score-main">
        <strong>{snapshot.healthScore}</strong>
        <span>/ 100</span>
      </div>
      <StatusBadge status={snapshot.status} />
      <p>{snapshot.explanation}</p>
      <div className="mh-health-scale" aria-label="Health scale from critical to healthy">
        <div className="mh-scale-track">
          <span className="mh-scale-critical"></span>
          <span className="mh-scale-warning"></span>
          <span className="mh-scale-healthy"></span>
          <i style={{ left: `${snapshot.healthScore}%` }}></i>
        </div>
        <div className="mh-scale-labels">
          <span>Critical</span>
          <span>Warning</span>
          <span>Healthy</span>
        </div>
      </div>
    </article>
  )
}
