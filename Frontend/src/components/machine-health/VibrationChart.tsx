export function VibrationChart({ values }: { values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 86 - ((value - min) / range) * 72
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <article className="mh-card mh-chart-card">
      <div className="mh-section-heading">
        <div>
          <h2>Live Vibration Signal</h2>
          <p>Last 10 seconds · Sampling rate: 1 kHz</p>
        </div>
        <span>Amplitude (g)</span>
      </div>
      <div className="mh-axis-chart">
        <span className="mh-y-label">+g</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Live vibration signal">
          <g className="mh-chart-grid-lines">
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="80" x2="100" y2="80" />
          </g>
          <polyline className="mh-vibration-line" points={points} />
        </svg>
        <span className="mh-x-label">time samples</span>
      </div>
    </article>
  )
}
