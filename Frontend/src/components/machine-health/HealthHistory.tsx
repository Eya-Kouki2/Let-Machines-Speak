import type { HealthHistoryPoint, HistoryRange } from '../../types/machineHealth'

interface HealthHistoryProps {
  points: HealthHistoryPoint[]
  range: HistoryRange
  onRangeChange: (range: HistoryRange) => void
}

export function HealthHistory({ points, range, onRangeChange }: HealthHistoryProps) {
  const chartPoints = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 92 - point.score * 0.82
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <article className="mh-card mh-history-card">
      <div className="mh-section-heading">
        <div>
          <h2>Health History</h2>
          <p>Score scale 0-100 with operating thresholds</p>
        </div>
        <div className="mh-range-tabs">
          {(['1h', '24h', '7d'] as const).map((item) => (
            <button key={item} className={range === item ? 'active' : ''} type="button" onClick={() => onRangeChange(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mh-history-plot">
        <span className="mh-score-axis top">100</span>
        <span className="mh-score-axis mid">50</span>
        <span className="mh-score-axis bottom">0</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Health score history">
          <rect className="mh-zone-healthy" x="0" y="10" width="100" height="18" />
          <rect className="mh-zone-warning" x="0" y="28" width="100" height="25" />
          <rect className="mh-zone-critical" x="0" y="53" width="100" height="39" />
          <polyline className="mh-history-line" points={chartPoints} />
        </svg>
      </div>
    </article>
  )
}
