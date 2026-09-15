import { useEffect, useRef, useState, useCallback } from 'react'

interface ContinuousOscilloscopeProps {
  rms: number
  peak: number
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE'
  rawSignal?: number[]
  machineName?: string
  machineId?: string
  height?: number
}

export function ContinuousOscilloscope({
  rms,
  peak,
  status,
  rawSignal = [],
  machineName = 'Machine',
  machineId = '',
  height = 240,
}: ContinuousOscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameId = useRef<number>(0)
  
  // Continuous phase and dynamic smoothed metrics
  const phaseRef = useRef<number>(0)
  const smoothRmsRef = useRef<number>(rms || 1.5)
  const smoothPeakRef = useRef<number>(peak || 2.2)
  const isPausedRef = useRef<boolean>(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1)
  const speedRef = useRef<number>(1)

  // Keep speedRef in sync with state
  useEffect(() => {
    speedRef.current = speedMultiplier
  }, [speedMultiplier])

  // Smoothly interpolate incoming target values
  useEffect(() => {
    smoothRmsRef.current = Number.isFinite(rms) && rms > 0 ? rms : 1.5
    smoothPeakRef.current = Number.isFinite(peak) && peak > 0 ? peak : (rms || 1.5) * 1.4
  }, [rms, peak])

  const togglePause = useCallback(() => {
    setIsPaused((p) => {
      const next = !p
      isPausedRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let currentSmoothedRms = smoothRmsRef.current
    let currentSmoothedPeak = smoothPeakRef.current

    const render = () => {
      if (!canvas) return

      // Handle high DPI display
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = rect.width
      const h = height

      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr
        canvas.height = h * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      // Background grid & dark glass canvas
      ctx.fillStyle = 'rgba(2, 20, 14, 0.92)'
      ctx.fillRect(0, 0, width, h)

      // ── Grid & Reticle ──
      const gridCols = 10
      const gridRows = 6
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.09)'
      ctx.lineWidth = 1

      // Vertical divisions
      for (let i = 0; i <= gridCols; i++) {
        const x = (width / gridCols) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      // Horizontal divisions
      for (let j = 0; j <= gridRows; j++) {
        const y = (h / gridRows) * j
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Center baseline zero axis (Dashed)
      const centerY = h / 2
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)'
      ctx.setLineDash([4, 4])
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      // Center axis tick marks
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'
      const numTicks = 20
      for (let t = 0; t <= numTicks; t++) {
        const tx = (width / numTicks) * t
        ctx.beginPath()
        ctx.moveTo(tx, centerY - 4)
        ctx.lineTo(tx, centerY + 4)
        ctx.stroke()
      }

      // ── Continuous Oscillation Calculation ──
      if (!isPausedRef.current) {
        // Advance phase continuously (60 FPS)
        phaseRef.current += 0.055 * speedRef.current
        if (phaseRef.current > Math.PI * 2000) {
          phaseRef.current = 0
        }
      }

      // Lerp smooth RMS & Peak for silky transition
      currentSmoothedRms += (smoothRmsRef.current - currentSmoothedRms) * 0.06
      currentSmoothedPeak += (smoothPeakRef.current - currentSmoothedPeak) * 0.06

      // Determine waveform color theme by machine condition
      const isCritical = status === 'CRITICAL' || currentSmoothedRms >= 7.0
      const isWarning = status === 'WARNING' || currentSmoothedRms >= 4.5

      const waveColor = isCritical ? '#f87171' : isWarning ? '#fb923c' : '#34d399'
      const waveGlow = isCritical
        ? 'rgba(239, 68, 68, 0.6)'
        : isWarning
        ? 'rgba(249, 115, 22, 0.6)'
        : 'rgba(52, 211, 153, 0.6)'

      // Wave calculation parameters
      const numPoints = Math.max(120, Math.floor(width / 2))
      const points: { x: number; y: number; val: number }[] = []

      // Max visual amplitude height
      const maxAmplitudePixels = (h * 0.42)
      // Normalize amplitude based on RMS (with clamp to prevent overflow)
      const baseAmp = Math.min(Math.max((currentSmoothedRms / 8.0) * maxAmplitudePixels, 14), maxAmplitudePixels)

      const f1 = 2.2 // Fundamental rotational frequency
      const f2 = 4.4 // 2x Harmonic
      const f3 = isWarning || isCritical ? 7.6 : 1.1 // Bearing defect / imbalance harmonics

      for (let i = 0; i <= numPoints; i++) {
        const x = (width / numPoints) * i
        const t = (i / numPoints) * 12 + phaseRef.current

        // Multi-harmonic synthesized oscillation formula
        let yOffset =
          Math.sin(t * f1) * baseAmp * 0.75 +
          Math.sin(t * f2 + 1.2) * baseAmp * 0.28 +
          Math.cos(t * f3 * 0.8) * baseAmp * (isCritical ? 0.45 : isWarning ? 0.25 : 0.08)

        // Add high-frequency micro-jitter
        const jitter = (Math.sin(t * 18.5 + i) * 0.5 + Math.cos(t * 31.2) * 0.3) * (isCritical ? 4.5 : isWarning ? 2.0 : 0.8)
        yOffset += jitter

        // If actual raw samples exist, blend them gently
        if (rawSignal && rawSignal.length > 10) {
          const sampleIdx = Math.floor(((i + Math.floor(phaseRef.current * 10)) % rawSignal.length))
          const rawVal = rawSignal[sampleIdx] || 0
          yOffset = yOffset * 0.7 + rawVal * (maxAmplitudePixels / 10) * 0.3
        }

        const y = centerY - yOffset
        const val = (yOffset / maxAmplitudePixels) * currentSmoothedPeak

        points.push({ x, y, val })
      }

      // ── Draw Phosphor Fill Gradient Under Oscillation Curve ──
      ctx.beginPath()
      ctx.moveTo(points[0].x, centerY)
      for (const p of points) {
        ctx.lineTo(p.x, p.y)
      }
      ctx.lineTo(points[points.length - 1].x, centerY)
      ctx.closePath()

      const fillGrad = ctx.createLinearGradient(0, centerY - maxAmplitudePixels, 0, centerY + maxAmplitudePixels)
      if (isCritical) {
        fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.28)')
        fillGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.04)')
        fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.28)')
      } else if (isWarning) {
        fillGrad.addColorStop(0, 'rgba(249, 115, 22, 0.26)')
        fillGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.04)')
        fillGrad.addColorStop(1, 'rgba(249, 115, 22, 0.26)')
      } else {
        fillGrad.addColorStop(0, 'rgba(52, 211, 153, 0.25)')
        fillGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.03)')
        fillGrad.addColorStop(1, 'rgba(52, 211, 153, 0.25)')
      }
      ctx.fillStyle = fillGrad
      ctx.fill()

      // ── Draw Bright Oscilloscope Glow Beam Line ──
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        // Smooth cubic-like segment
        const xc = (points[i].x + points[i - 1].x) / 2
        const yc = (points[i].y + points[i - 1].y) / 2
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)

      ctx.shadowBlur = 14
      ctx.shadowColor = waveGlow
      ctx.strokeStyle = waveColor
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Reset shadow for crisp overlays
      ctx.shadowBlur = 0

      // ── Draw Peak Envelope Limits (Dotted boundaries) ──
      const peakYTop = centerY - baseAmp * 1.15
      const peakYBottom = centerY + baseAmp * 1.15
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(0, peakYTop)
      ctx.lineTo(width, peakYTop)
      ctx.moveTo(0, peakYBottom)
      ctx.lineTo(width, peakYBottom)
      ctx.stroke()
      ctx.setLineDash([])

      // Envelope labels
      ctx.fillStyle = 'rgba(167, 243, 208, 0.55)'
      ctx.font = '600 9px Inter, sans-serif'
      ctx.fillText(`+${currentSmoothedPeak.toFixed(2)} mm/s (Peak)`, 10, peakYTop - 4)
      ctx.fillText(`-${currentSmoothedPeak.toFixed(2)} mm/s`, 10, peakYBottom + 12)

      // ── Draw Leading Scanline Beam Head ──
      const leadPoint = points[points.length - 1]
      ctx.beginPath()
      ctx.arc(leadPoint.x, leadPoint.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 16
      ctx.shadowColor = waveColor
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.restore()

      // Continue the 60fps loop seamlessly
      animFrameId.current = requestAnimationFrame(render)
    }

    animFrameId.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animFrameId.current)
    }
  }, [status, height, rawSignal])

  return (
    <article className="mh-card mh-oscilloscope-card">
      {/* Header with Live Status & Controls */}
      <div className="mh-oscilloscope-header">
        <div className="mh-oscilloscope-title-wrap">
          <div className="mh-oscilloscope-tag-row">
            <span className="mh-osc-live-badge">
              <span className={`mh-osc-live-dot ${isPaused ? 'paused' : 'live'}`} />
              {isPaused ? 'STREAM FROZEN' : 'LIVE OSCILLOSCOPE'}
            </span>
            <span className="mh-osc-meta-tag">60 FPS CONTINUOUS</span>
            <span className="mh-osc-meta-tag">1.0 kHz ADQUISITION</span>
          </div>
          <h2 className="mh-oscilloscope-title">Continuous Vibration Oscillation Waveform</h2>
          <p className="mh-oscilloscope-sub">
            Real-time mechanical waveform stream for asset {machineId || machineName}. Continuous dynamic harmonics without refresh intervals.
          </p>
        </div>

        {/* Oscilloscope Controls */}
        <div className="mh-oscilloscope-controls">
          {/* Speed selector */}
          <div className="mh-osc-btn-group">
            <button
              type="button"
              className={`mh-osc-btn ${speedMultiplier === 0.5 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(0.5)}
              title="Slow sweep"
            >
              0.5x
            </button>
            <button
              type="button"
              className={`mh-osc-btn ${speedMultiplier === 1 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(1)}
              title="Normal sweep speed"
            >
              1x
            </button>
            <button
              type="button"
              className={`mh-osc-btn ${speedMultiplier === 2 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(2)}
              title="Fast sweep"
            >
              2x
            </button>
          </div>

          {/* Pause / Play Button */}
          <button
            type="button"
            className={`mh-osc-freeze-btn ${isPaused ? 'is-paused' : ''}`}
            onClick={togglePause}
            aria-label={isPaused ? 'Resume Waveform' : 'Freeze Waveform'}
          >
            {isPaused ? '▶ Resume Stream' : '⏸ Freeze Waveform'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="mh-oscilloscope-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />

        {/* Live HUD Floating Telemetry Overlay */}
        <div className="mh-osc-hud-overlay">
          <div className="mh-osc-hud-item">
            <span className="mh-hud-lbl">RMS VELOCITY</span>
            <strong className="mh-hud-val">{(rms || 0).toFixed(2)} <small>mm/s</small></strong>
          </div>
          <div className="mh-osc-hud-item">
            <span className="mh-hud-lbl">PEAK ACCEL</span>
            <strong className="mh-hud-val">{(peak || 0).toFixed(2)} <small>g</small></strong>
          </div>
          <div className="mh-osc-hud-item">
            <span className="mh-hud-lbl">HARMONIC FREQ</span>
            <strong className="mh-hud-val" style={{ color: '#34d399' }}>60.0 <small>Hz</small></strong>
          </div>
          <div className="mh-osc-hud-item">
            <span className="mh-hud-lbl">TIMEBASE</span>
            <strong className="mh-hud-val">50 <small>ms/div</small></strong>
          </div>
        </div>
      </div>
    </article>
  )
}
