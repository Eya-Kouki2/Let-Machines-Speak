import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartData, ChartOptions, Plugin } from 'chart.js'

// Brand Color Palette
export const LABES_COLORS = {
  greenDark: '#052e1f',
  green: '#145338',
  emerald: '#10b981',
  mint: '#d4e8d8',
  mintLight: '#eef7f1',
  orange: '#f97316',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#1e293b',
  muted: '#64748b',
  grid: 'rgba(20, 83, 56, 0.08)',
  slate: '#94a3b8',
}

// ---------------------------------------------------------------------------
// 1. DOUGHNUT CHART (Machine Status Distribution)
// ---------------------------------------------------------------------------
interface DoughnutChartProps {
  healthy: number
  warning: number
  critical: number
  offline?: number
  size?: number
}

export function LabesDoughnutChart({
  healthy,
  warning,
  critical,
  offline = 0,
  size = 130,
}: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const total = healthy + warning + critical + offline

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const data: ChartData<'doughnut'> = {
      labels: ['Healthy', 'Warning', 'Critical', 'Offline'],
      datasets: [
        {
          data: total === 0 ? [1, 0, 0, 0] : [healthy, warning, critical, offline],
          backgroundColor:
            total === 0
              ? ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1']
              : [LABES_COLORS.emerald, LABES_COLORS.warning, LABES_COLORS.danger, LABES_COLORS.slate],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    }

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: total > 0,
          backgroundColor: LABES_COLORS.greenDark,
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label(tooltipItem) {
              const val = Number(tooltipItem.raw)
              const pct = total > 0 ? Math.round((val / total) * 100) : 0
              return ` ${tooltipItem.label}: ${val} (${pct}%)`
            },
          },
        },
      },
    }

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data,
      options,
    })

    return () => {
      chartInstance.current?.destroy()
    }
  }, [healthy, warning, critical, offline, total])

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        margin: '0 auto',
      }}
    >
      <canvas ref={canvasRef} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <strong
          style={{
            display: 'block',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: LABES_COLORS.greenDark,
            lineHeight: 1.1,
          }}
        >
          {total}
        </strong>
        <span
          style={{
            fontSize: '0.72rem',
            color: LABES_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          machines
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. LINE CHART (Trend, Vibration RMS, Health History)
// ---------------------------------------------------------------------------
export interface ThresholdAnnotation {
  value: number
  label: string
  color: string
}

interface LineChartProps {
  labels: string[]
  datasets: {
    label: string
    data: (number | null)[]
    color?: string
    fill?: boolean
    fillColor?: string
    dashed?: boolean
  }[]
  thresholds?: ThresholdAnnotation[]
  yMin?: number
  yMax?: number
  yUnit?: string
  height?: number
  xTitle?: string
  yTitle?: string
}

export function LabesLineChart({
  labels,
  datasets,
  thresholds = [],
  yMin,
  yMax,
  yUnit = '',
  height = 200,
  xTitle,
  yTitle,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Threshold lines plugin
    const thresholdPlugin: Plugin<'line'> = {
      id: 'thresholdLines',
      afterDraw(chart) {
        if (!thresholds.length) return
        const {
          ctx: c,
          chartArea: { left, right },
          scales: { y },
        } = chart
        if (!y) return

        c.save()
        for (const t of thresholds) {
          const yPos = y.getPixelForValue(t.value)
          if (yPos >= chart.chartArea.top && yPos <= chart.chartArea.bottom) {
            c.beginPath()
            c.setLineDash([5, 5])
            c.strokeStyle = t.color
            c.lineWidth = 1.5
            c.moveTo(left, yPos)
            c.lineTo(right, yPos)
            c.stroke()

            // Label
            c.setLineDash([])
            c.fillStyle = t.color
            c.font = '600 10px Inter, sans-serif'
            c.textAlign = 'right'
            c.fillText(`${t.label} (${t.value}${yUnit ? ` ${yUnit}` : ''})`, right - 4, yPos - 4)
          }
        }
        c.restore()
      },
    }

    const chartData: ChartData<'line'> = {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color || LABES_COLORS.emerald,
        backgroundColor: ds.fillColor || 'rgba(16, 185, 129, 0.08)',
        fill: ds.fill ?? false,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: labels.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: ds.color || LABES_COLORS.emerald,
        borderDash: ds.dashed ? [4, 4] : undefined,
      })),
    }

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: datasets.length > 1,
          position: 'top',
          labels: {
            color: LABES_COLORS.greenDark,
            boxWidth: 12,
            font: { family: 'Inter', size: 11, weight: 'bold' },
          },
        },
        tooltip: {
          backgroundColor: LABES_COLORS.greenDark,
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          borderColor: LABES_COLORS.grid,
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label(item) {
              const val = item.raw
              if (typeof val === 'number' && Number.isFinite(val)) {
                const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(2)
                return ` ${item.dataset.label}: ${formatted}${yUnit ? ` ${yUnit}` : ''}`
              }
              return ` ${item.dataset.label}: N/A`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: LABES_COLORS.grid },
          ticks: {
            color: LABES_COLORS.muted,
            font: { family: 'Inter', size: 10 },
            maxTicksLimit: 8,
          },
          title: xTitle
            ? {
                display: true,
                text: xTitle,
                color: LABES_COLORS.muted,
                font: { size: 10, weight: 'bold' },
              }
            : undefined,
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: LABES_COLORS.grid },
          ticks: {
            color: LABES_COLORS.muted,
            font: { family: 'Inter', size: 10 },
            callback(val) {
              return `${val}${yUnit ? ` ${yUnit}` : ''}`
            },
          },
          title: yTitle
            ? {
                display: true,
                text: yTitle,
                color: LABES_COLORS.muted,
                font: { size: 10, weight: 'bold' },
              }
            : undefined,
        },
      },
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options,
      plugins: [thresholdPlugin],
    })

    return () => {
      chartInstance.current?.destroy()
    }
  }, [labels, datasets, thresholds, yMin, yMax, yUnit, xTitle, yTitle])

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. BAR CHART (Safety Events by Type / Zone Comparison)
// ---------------------------------------------------------------------------
interface BarChartProps {
  labels: string[]
  data: number[]
  colors?: string[]
  height?: number
  yUnit?: string
}

export function LabesBarChart({
  labels,
  data,
  colors,
  height = 180,
  yUnit = '',
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const defaultColors = [
      LABES_COLORS.danger,
      LABES_COLORS.warning,
      LABES_COLORS.orange,
      LABES_COLORS.slate,
    ]

    const chartData: ChartData<'bar'> = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors || labels.map((_, i) => defaultColors[i % defaultColors.length]),
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 32,
        },
      ],
    }

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: LABES_COLORS.greenDark,
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label(item) {
              return ` ${item.raw}${yUnit ? ` ${yUnit}` : ''}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: LABES_COLORS.greenDark,
            font: { family: 'Inter', size: 10, weight: 'bold' },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: LABES_COLORS.grid },
          ticks: {
            color: LABES_COLORS.muted,
            font: { family: 'Inter', size: 10 },
            precision: 0,
          },
        },
      },
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options,
    })

    return () => {
      chartInstance.current?.destroy()
    }
  }, [labels, data, colors, yUnit])

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
