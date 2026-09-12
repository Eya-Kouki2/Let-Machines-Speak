
export interface ThresholdGaugeProps {
  label: string
  value: number
  unit: string
  warningThreshold: number
  criticalThreshold: number
  maxScale?: number
  precision?: number
}

export function ThresholdGauge({
  label,
  value,
  unit,
  warningThreshold,
  criticalThreshold,
  maxScale,
  precision = 2,
}: ThresholdGaugeProps) {
  // Determine metric status based on the machine's thresholds
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL'
  let statusColor = '#10b981' // emerald

  if (value >= criticalThreshold) {
    status = 'CRITICAL'
    statusColor = '#ef4444' // red
  } else if (value >= warningThreshold) {
    status = 'WARNING'
    statusColor = '#f97316' // orange
  }

  // Calculate full scale: at least 1.3x critical or maxScale or 1.2x value
  const totalMax = maxScale ?? Math.max(criticalThreshold * 1.35, value * 1.15, 1)
  const clampedValue = Math.min(Math.max(value, 0), totalMax)
  const markerPercent = Math.min(Math.max((clampedValue / totalMax) * 100, 0), 100)

  // Segment widths in %
  const normalWidth = (warningThreshold / totalMax) * 100
  const warningWidth = ((criticalThreshold - warningThreshold) / totalMax) * 100
  const criticalWidth = Math.max(0, 100 - normalWidth - warningWidth)

  const formattedValue = value.toFixed(precision)

  return (
    <div className="mh-threshold-card">
      <div className="mh-threshold-topline">
        <span className="mh-threshold-label">{label}</span>
        <span
          className={`mh-threshold-badge mh-status-${status.toLowerCase()}`}
          style={{
            borderColor: statusColor,
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          }}
        >
          {status}
        </span>
      </div>

      <div className="mh-threshold-val-row">
        <strong className="mh-threshold-value">
          {formattedValue}
          <small className="mh-threshold-unit"> {unit}</small>
        </strong>
      </div>

      {/* Horizontal threshold bar */}
      <div className="mh-gauge-track-wrap">
        <div className="mh-gauge-track" title={`Value: ${formattedValue} ${unit} | Warning: ${warningThreshold} | Critical: ${criticalThreshold}`}>
          <div
            className="mh-gauge-seg mh-seg-normal"
            style={{ width: `${normalWidth}%` }}
            title={`Normal: 0 to ${warningThreshold}${unit}`}
          />
          <div
            className="mh-gauge-seg mh-seg-warning"
            style={{ width: `${warningWidth}%` }}
            title={`Warning: ${warningThreshold} to ${criticalThreshold}${unit}`}
          />
          <div
            className="mh-gauge-seg mh-seg-critical"
            style={{ width: `${criticalWidth}%` }}
            title={`Critical: > ${criticalThreshold}${unit}`}
          />

          {/* Current value pin marker */}
          <div
            className="mh-gauge-marker"
            style={{
              left: `${markerPercent}%`,
              borderColor: statusColor,
            }}
          >
            <div className="mh-gauge-marker-pin" style={{ backgroundColor: statusColor }} />
          </div>
        </div>

        {/* Labels below the track */}
        <div className="mh-gauge-threshold-labels">
          <span className="mh-gauge-lbl-norm">0</span>
          <span className="mh-gauge-lbl-warn" style={{ left: `${normalWidth}%` }}>
            Warn {warningThreshold}
          </span>
          <span className="mh-gauge-lbl-crit" style={{ left: `${normalWidth + warningWidth}%` }}>
            Crit {criticalThreshold}
          </span>
        </div>
      </div>
    </div>
  )
}
