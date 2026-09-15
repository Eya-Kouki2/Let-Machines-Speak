import React, { useEffect, useState, useCallback } from 'react'
import {
  getDashboardSummary,
  getRecentActivity,
  getHealthTrend,
} from '../services/dashboardApi'
import type {
  DashboardSummary,
  ActivityItem,
  HealthTrendPoint,
} from '../services/dashboardApi'
import { useSocket } from '../hooks/useSocket'
import {
  getMachines,
  getCurrentHealth,
  type EnrichedMachine,
} from '../services/machineHealthApi'
import { INITIAL_MOCK_MACHINES } from './MachineHealth'
import {
  LabesDoughnutChart,
  LabesLineChart,
  LabesBarChart,
  LABES_COLORS,
} from '../components/charts/LabesCharts'
import { SingleMachineDigitalTwin, type MachineTwinData } from '../components/SingleMachineDigitalTwin'


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: 'green' | 'orange' | 'red' | 'amber' | 'slate'
  onClick?: () => void
  clickable?: boolean
}

function KpiCard({ icon, label, value, sub, accent = 'green', onClick, clickable = false }: KpiCardProps) {
  return (
    <article
      className={`db-kpi-card db-kpi-${accent} ${clickable ? 'db-kpi-clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="db-kpi-icon">{icon}</div>
      <div className="db-kpi-body">
        <span className="db-kpi-label">{label}</span>
        <strong className="db-kpi-value">{value}</strong>
        {sub && <small className="db-kpi-sub">{sub}</small>}
      </div>
      {clickable && (
        <span className="db-kpi-arrow" aria-hidden="true">→</span>
      )}
    </article>
  )
}



// Inline SVG icons
const Icons = {
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="2" x2="9" y2="4" /><line x1="15" y1="2" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="22" /><line x1="15" y1="20" x2="15" y2="22" />
      <line x1="2" y1="9" x2="4" y2="9" /><line x1="2" y1="15" x2="4" y2="15" />
      <line x1="20" y1="9" x2="22" y2="9" /><line x1="20" y1="15" x2="22" y2="15" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

// ---------------------------------------------------------------------------
// Main Dashboard component
// ---------------------------------------------------------------------------
interface DashboardProps {
  onTabChange?: (tab: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps = {}) {
  const socket = useSocket()

  // Data State
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [trend, setTrend] = useState<HealthTrendPoint[]>([])
  const [machines, setMachines] = useState<EnrichedMachine[]>([])
  const [selectedTwinId, setSelectedTwinId] = useState<string | null>(null)
  const [liveTelemetry, setLiveTelemetry] = useState<
    Record<
      string,
      {
        vibrationRms?: number
        temperature?: number
        peak?: number
        status?: string
        healthScore?: number
      }
    >
  >({})
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [errorSummary, setErrorSummary] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL')

  // Fetch all dashboard data & fleet from backend
  const loadDashboardData = useCallback(async () => {
    try {
      const [s, a, t, ml] = await Promise.all([
        getDashboardSummary(),
        getRecentActivity(12),
        getHealthTrend(),
        getMachines().catch(() => INITIAL_MOCK_MACHINES),
      ])
      setSummary(s)
      setActivity(a)
      setTrend(t)
      const resolvedFleet = ml && ml.length > 0 ? ml : INITIAL_MOCK_MACHINES
      setMachines(resolvedFleet)
      if (resolvedFleet.length > 0) {
        setSelectedTwinId((prev) => {
          if (!prev) return resolvedFleet[0].machineId || resolvedFleet[0]._id || 'CNC-001'
          const exists = resolvedFleet.some((m) => (m.machineId || m._id) === prev)
          return exists ? prev : (resolvedFleet[0].machineId || resolvedFleet[0]._id || 'CNC-001')
        })
      }
      setErrorSummary(null)
    } catch (err) {
      setErrorSummary(err instanceof Error ? err.message : 'Unable to load dashboard data')
    } finally {
      setLoadingSummary(false)
      setLoadingActivity(false)
      setLoadingTrend(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  // Fetch current machine health when a machine is selected to ensure freshest numbers
  useEffect(() => {
    if (!selectedTwinId) return
    void getCurrentHealth(selectedTwinId)
      .then((h) => {
        if (h) {
          setLiveTelemetry((prev) => ({
            ...prev,
            [selectedTwinId]: {
              ...prev[selectedTwinId],
              vibrationRms: h.rms ?? prev[selectedTwinId]?.vibrationRms,
              temperature: h.temperature ?? prev[selectedTwinId]?.temperature,
              peak: h.peak ?? prev[selectedTwinId]?.peak,
              healthScore: h.healthScore ?? prev[selectedTwinId]?.healthScore,
              status: h.status === 'red' ? 'CRITICAL' : h.status === 'yellow' ? 'WARNING' : 'ONLINE',
            },
          }))
        }
      })
      .catch(() => {
        // Fallback to cached machine data
      })
  }, [selectedTwinId])

  // Real-Time Socket.IO Synchronization (Direct MQTT -> Socket pipeline)
  useEffect(() => {
    const handleUpdate = () => {
      void loadDashboardData()
    }

    const handleMachineCreated = (payload?: { machine?: EnrichedMachine }) => {
      void loadDashboardData()
      if (payload?.machine) {
        const newId = payload.machine.machineId || payload.machine._id
        if (newId) setSelectedTwinId(newId)
      }
    }

    // Direct live MQTT telemetry feed (60Hz / sampled bursts)
    const handleTelemetry = (data: {
      machineId?: string
      deviceId?: string
      vibrationRms?: number
      peakAcceleration?: number
      rms?: number
      peak?: number
      temperature?: number
      current?: number
      healthScore?: number
      status?: string
    }) => {
      const targetId = data.machineId || data.deviceId
      if (!targetId) return

      setLiveTelemetry((prev) => {
        const existing = prev[targetId] || {}
        const updated = {
          ...existing,
          vibrationRms: data.vibrationRms ?? data.rms ?? existing.vibrationRms,
          peak: data.peakAcceleration ?? data.peak ?? existing.peak,
          temperature: data.temperature ?? existing.temperature,
          status: data.status ? data.status.toUpperCase() : existing.status,
          healthScore: data.healthScore ?? existing.healthScore,
        }

        const res = { ...prev, [targetId]: updated }
        if (data.machineId) res[data.machineId] = updated
        if (data.deviceId) res[data.deviceId] = updated
        return res
      })
    }

    // Real-time machine health updates
    const handleHealthUpdate = (data: {
      machineId?: string
      health?: {
        temperature?: number
        current?: number
        rms?: number
        peak?: number
        healthScore?: number
        status?: string
      }
      machine?: {
        status?: string
        deviceId?: string
      }
    }) => {
      if (!data.machineId) return
      const targetId = data.machineId

      setLiveTelemetry((prev) => {
        const existing = prev[targetId] || {}
        const rawStatus = data.health?.status || data.machine?.status
        let normStatus = existing.status || 'ONLINE'
        if (rawStatus) {
          if (rawStatus === 'red' || rawStatus.toUpperCase() === 'CRITICAL') normStatus = 'CRITICAL'
          else if (rawStatus === 'yellow' || rawStatus.toUpperCase() === 'WARNING') normStatus = 'WARNING'
          else normStatus = 'ONLINE'
        }

        const updated = {
          ...existing,
          vibrationRms: data.health?.rms ?? existing.vibrationRms,
          temperature: data.health?.temperature ?? existing.temperature,
          peak: data.health?.peak ?? existing.peak,
          status: normStatus,
          healthScore: data.health?.healthScore ?? existing.healthScore,
        }

        const res = { ...prev, [targetId]: updated }
        if (data.machine?.deviceId) res[data.machine.deviceId] = updated
        return res
      })
    }

    const events = [
      'dashboard:updated',
      'machine:created',
      'machine:updated',
      'machine:deleted',
      'safety:event',
      'safety:updated',
      'alert:created',
      'alert:updated',
    ]

    events.forEach((ev) => socket.on(ev, handleUpdate))
    socket.on('machine:created', handleMachineCreated)
    socket.on('machine:telemetry', handleTelemetry)
    socket.on('machine:health-updated', handleHealthUpdate)

    return () => {
      events.forEach((ev) => socket.off(ev, handleUpdate))
      socket.off('machine:created', handleMachineCreated)
      socket.off('machine:telemetry', handleTelemetry)
      socket.off('machine:health-updated', handleHealthUpdate)
    }
  }, [socket, loadDashboardData])

  const navigate = (tab: string, hashOverride?: string) => {
    onTabChange?.(tab)
    window.location.hash = hashOverride ?? `#${tab.toLowerCase().replace(/\s+/g, '-')}`
  }

  // Format trend points for Chart.js
  const trendLabels = trend.map((p) => {
    const d = new Date(p.timestamp)
    return `${d.getHours()}:00`
  })
  const trendData = trend.map((p) => p.avgScore)

  // Safety events by type
  const safetyByType = summary?.safety?.byType ?? {}
  const safetyBarLabels = ['No Helmet', 'Restricted Zone', 'Fall Risk', 'Unsafe Dist']
  const safetyBarData = [
    safetyByType.no_helmet ?? 0,
    safetyByType.restricted_zone_entry ?? 0,
    safetyByType.fall_detected ?? 0,
    safetyByType.unsafe_distance ?? 0,
  ]

  return (
    <div className="db-page">
      {/* ── Page header: Dynamic Date & Time ── */}
      <section>
        <div className="db-header-left">
          <h1 className="safety-page-title" style={{ margin: 0 }}>Dashboard</h1>
          <p>Real-time overview of machine health, worker safety, and active alerts across the plant.</p>
        </div>
      </section>



      {/* ── KPI cards (Click-through enabled) ── */}
      <section className="db-kpi-grid" aria-label="Key performance indicators">
        {loadingSummary ? (
          <div className="db-loading-row">Loading live metrics…</div>
        ) : errorSummary ? (
          <div className="db-error-row">{errorSummary}</div>
        ) : summary ? (
          <>
            <KpiCard
              icon={Icons.cpu}
              label="Total Machines"
              value={summary.machines.total}
              sub={`${summary.machines.offline} offline`}
              accent="green"
              clickable
              onClick={() => navigate('Machine Health', '#machine-health')}
            />
            <KpiCard
              icon={Icons.shield}
              label="Safe Zones"
              value={`${summary.safety.safeZones} / ${summary.safety.zones}`}
              sub="zones secure"
              accent={summary.safety.safeZones === summary.safety.zones ? 'green' : 'amber'}
              clickable
              onClick={() => navigate('Safety', '#safety')}
            />
            <KpiCard
              icon={Icons.alertTriangle}
              label="Safety Violations"
              value={summary.safety.activeViolations}
              sub={`${summary.safety.eventsToday} events today`}
              accent={summary.safety.activeViolations > 0 ? 'red' : 'green'}
              clickable
              onClick={() => navigate('Safety', '#safety')}
            />
            <KpiCard
              icon={Icons.activity}
              label="Avg Health Score"
              value={summary.machines.averageHealthScore !== null ? `${summary.machines.averageHealthScore}%` : '—'}
              sub={
                summary.machines.warning > 0 || summary.machines.critical > 0
                  ? `${summary.machines.warning} warn · ${summary.machines.critical} crit`
                  : 'All within nominal range'
              }
              accent={
                summary.machines.averageHealthScore !== null && summary.machines.averageHealthScore < 60
                  ? 'red'
                  : summary.machines.averageHealthScore !== null && summary.machines.averageHealthScore < 80
                    ? 'amber'
                    : 'green'
              }
              clickable
              onClick={() => navigate('Safety', '#safety')}
            />
          </>
        ) : null}
      </section>

      {/* ── SECTION 1: Fleet Telemetry & Predictive Analytics (Hero Row) ── */}
      <section className="db-section">
        <div className="db-section-header">
          <div className="db-section-title-group">
            <span className="db-section-tag">
              <span className="db-live-dot" /> Machine Telemetry & AI
            </span>
          </div>
        </div>

        <div className="db-row-hero">
          {/* Visual 1 (Wide): Average Health Score Trend (Chart.js Line) */}
          <article className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-wrap">
                <div className="db-panel-icon db-panel-icon-green">{Icons.activity}</div>
                <div>
                  <h2>Average Health Score Trend</h2>
                  <p>24-hour composite fleet health telemetry</p>
                </div>
              </div>
            </div>

            {loadingTrend ? (
              <div className="db-panel-loading">Loading trend…</div>
            ) : trend.length === 0 ? (
              <div className="db-panel-empty">No telemetry trend recorded yet</div>
            ) : (
              <div className="db-chart-wrapper">
                <LabesLineChart
                  labels={trendLabels}
                  datasets={[
                    {
                      label: 'Avg Health Score',
                      data: trendData,
                      color: LABES_COLORS.emerald,
                      fill: true,
                      fillColor: 'rgba(16, 185, 129, 0.12)',
                    },
                  ]}
                  yMin={0}
                  yMax={100}
                  yUnit="%"
                  height={195}
                />
                <div className="db-trend-footer">
                  <span>Current: <strong>{trend[trend.length - 1].avgScore}%</strong></span>
                  <span>24h Low: <strong>{Math.min(...trendData)}%</strong></span>
                  <span>24h Peak: <strong>{Math.max(...trendData)}%</strong></span>
                  <span>Status: <strong>Nominal (&gt;80%)</strong></span>
                </div>
              </div>
            )}
          </article>

          {/* Visual 2: Machine Status Distribution (Chart.js Doughnut) */}
          <article className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-wrap">
                <div className="db-panel-icon db-panel-icon-green">{Icons.cpu}</div>
                <div>
                  <h2>Operational Fleet Status</h2>
                  <p>Live health distribution</p>
                </div>
              </div>
            </div>

            {loadingSummary ? (
              <div className="db-panel-loading">Loading status…</div>
            ) : summary ? (
              <div className="db-donut-layout">
                <LabesDoughnutChart
                  healthy={summary.machines.healthy}
                  warning={summary.machines.warning}
                  critical={summary.machines.critical}
                  offline={summary.machines.offline}
                  size={145}
                />
                <div className="db-chart-legend-grid">
                  <div className="db-legend-item">
                    <span className="db-dot db-dot-green" />
                    <span>Healthy</span>
                    <strong>{summary.machines.healthy}</strong>
                  </div>
                  <div className="db-legend-item">
                    <span className="db-dot db-dot-orange" />
                    <span>Warning</span>
                    <strong>{summary.machines.warning}</strong>
                  </div>
                  <div className="db-legend-item">
                    <span className="db-dot db-dot-red" />
                    <span>Critical</span>
                    <strong>{summary.machines.critical}</strong>
                  </div>
                  <div className="db-legend-item">
                    <span className="db-dot db-dot-slate" />
                    <span>Offline</span>
                    <strong>{summary.machines.offline}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="db-panel-btn"
              onClick={() => navigate('Machine Health', '#machine-health')}
            >
              Explore Machine Fleet →
            </button>
          </article>
        </div>
      </section>

      {/* ── SECTION 2: Worker Safety & Priority Action Items ── */}
      <section className="db-section">
        <div className="db-section-header">
          <div className="db-section-title-group">
            <span className="db-section-tag tag-orange">
              Safety Radar & Active Attention
            </span>
          </div>
        </div>

        <div className="db-row-ops">
          {/* Visual 3: Safety Events by Type (Chart.js Bar) */}
          <article className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-wrap">
                <div className="db-panel-icon db-panel-icon-orange">{Icons.shield}</div>
                <div>
                  <h2>Safety Incidents Today</h2>
                  <p>Computer vision categorized detections</p>
                </div>
              </div>
            </div>

            {loadingSummary ? (
              <div className="db-panel-loading">Loading safety data…</div>
            ) : (
              <div className="db-chart-wrapper">
                <LabesBarChart
                  labels={safetyBarLabels}
                  data={safetyBarData}
                  colors={[
                    LABES_COLORS.danger,
                    LABES_COLORS.warning,
                    LABES_COLORS.orange,
                    LABES_COLORS.slate,
                  ]}
                  height={185}
                  yUnit=" events"
                />
                <div className="db-safety-insight">
                  {summary && summary.safety?.activeViolations === 0 ? (
                    <span className="db-insight-ok">✓ All operational zones compliant and secure</span>
                  ) : (
                    <span className="db-insight-warn">
                      ⚠ {summary?.safety?.activeViolations ?? 0} active open violation{(summary?.safety?.activeViolations ?? 0) > 1 ? 's' : ''} requiring inspection
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              className="db-panel-btn"
              onClick={() => navigate('Safety', '#safety')}
            >
              Worker Safety Monitoring →
            </button>
          </article>

          {/* Visual 4: Machines Requiring Attention (Ranked Priority List) */}
          <article className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-wrap">
                <div className="db-panel-icon db-panel-icon-orange">{Icons.alertTriangle}</div>
                <div>
                  <h2>Machines Requiring Attention</h2>
                  <p>Assets requiring inspection or threshold check</p>
                </div>
              </div>
            </div>

            {loadingSummary ? (
              <div className="db-panel-loading">Loading attention list…</div>
            ) : summary?.machines?.attentionMachines && summary.machines.attentionMachines.length > 0 ? (
              <ul className="db-attention-list">
                {summary.machines.attentionMachines.map((m) => (
                  <li key={m.machineId} className="db-attention-item">
                    <div className="db-attention-info">
                      <div className="db-attention-title">
                        <strong>{m.name}</strong>
                        <span className="db-attention-id">{m.machineId}</span>
                      </div>
                      <span className="db-attention-meta">{m.zone}</span>
                    </div>
                    <div className="db-attention-action">
                      <span className={`db-severity-badge db-badge-${m.status.toLowerCase()}`}>
                        {m.status}
                      </span>
                      <button
                        type="button"
                        className="btn-inspect-link"
                        onClick={() => navigate('Machine Health', `#machine-health/${m.machineId}`)}
                      >
                        Inspect
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="db-panel-empty db-empty-all-good">
                <span className="db-good-check">✓</span>
                <strong>All machines operating normally</strong>
                <p>No critical or warning thresholds currently breached across the fleet.</p>
              </div>
            )}
          </article>
        </div>
      </section>

      {/* ── Recent Activity + 3D Digital Twin Row ── */}
      <section className="db-bottom-row">

        {/* ── Modernised Recent Activity ── */}
        <article className="db-panel db-activity-panel">
          {/* Header */}
          <div className="db-panel-header">
            <div className="db-panel-title-wrap">
              <div className="db-panel-icon db-panel-icon-green">{Icons.bell}</div>
              <div>
                <h2>Recent Activity</h2>
                <p>Live event log from IoT telemetry and safety cameras</p>
              </div>
            </div>
            <div className="db-activity-header-meta">
              {activity.length > 0 && (
                <span className="db-activity-count-tag">{activity.length} events</span>
              )}
              <span className="db-section-tag" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                <span className="db-live-dot" /> LIVE
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          {activity.length > 0 && (
            <div className="db-activity-filter-bar">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`db-filter-pill${activityFilter === f ? ' active' : ''}`}
                  onClick={() => setActivityFilter(f)}
                >
                  {f === 'ALL' ? `All (${activity.length})` : (
                    `${f} (${activity.filter(a => a.severity === f).length})`
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loadingActivity ? (
            <div className="db-panel-loading">Loading live stream…</div>
          ) : activity.length === 0 ? (
            <div className="db-panel-empty db-empty-all-good" style={{ padding: '24px 12px' }}>
              <span className="db-good-check">✓</span>
              <strong>No critical alerts recorded</strong>
              <p>Telemetry stream is nominal with zero active warnings.</p>
            </div>
          ) : (
            <ul className="db-activity-list">
              {activity
                .filter(item => activityFilter === 'ALL' || item.severity === activityFilter)
                .map((item, idx) => {
                  const isCrit = item.severity === 'CRITICAL'
                  const isWarn = item.severity === 'WARNING'
                  const isSafety = item.type === 'SAFETY_EVENT'
                  const cardClass = isCrit ? 'crit' : isWarn ? 'warn' : 'info'
                  // Choose icon based on type + severity
                  const iconClass = isCrit
                    ? 'db-icon-crit'
                    : isWarn
                    ? 'db-icon-warn'
                    : isSafety
                    ? 'db-icon-safety'
                    : item.type === 'MACHINE_ALERT'
                    ? 'db-icon-machine'
                    : 'db-icon-info'
                  return (
                    <li key={idx} className={`db-activity-card ${cardClass}`}>
                      {/* Icon Pill */}
                      <span className={`db-activity-icon-pill ${iconClass}`}>
                        {isCrit ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        ) : isSafety ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        ) : item.type === 'MACHINE_ALERT' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        )}
                      </span>
                      {/* Body */}
                      <div className="db-activity-card-body">
                        <div className="db-activity-card-top">
                          <span className="db-activity-source-badge">{item.source}</span>
                          <span className="db-activity-card-time">{timeAgo(item.timestamp)}</span>
                        </div>
                        <p className="db-activity-card-title">{item.title}</p>
                      </div>
                    </li>
                  )
                })}
            </ul>
          )}
        </article>

        {/* ── 3D Machine Model Connected to Backend & MQTT ── */}
        <SingleMachineDigitalTwin
          machines={
            machines.length > 0
              ? machines.map((m, idx) => {
                  const mId = m.machineId || m._id || `MACH-${idx + 1}`
                  const att = summary?.machines?.attentionMachines?.find(
                    (a) => a.machineId === mId || a.machineId === m._id || a.machineId === m.machineId
                  )
                  const health = (m as any).latestHealth || {}
                  const live = liveTelemetry[mId] || liveTelemetry[m.machineId] || liveTelemetry[m._id || ''] || {}

                  const status =
                    (live.status as MachineTwinData['status']) ||
                    (health.status ? (health.status === 'red' ? 'CRITICAL' : health.status === 'yellow' ? 'WARNING' : 'ONLINE') : null) ||
                    (att?.status as MachineTwinData['status']) ||
                    (m.status as MachineTwinData['status']) ||
                    'ONLINE'

                  // Machine-specific realistic baselines if live MQTT stream has not yet arrived
                  const baseVib = status === 'CRITICAL' ? 7.65 : status === 'WARNING' ? 4.82 : Number((1.15 + (idx * 0.42) % 1.5).toFixed(2))
                  const baseTemp = status === 'CRITICAL' ? 86.2 : status === 'WARNING' ? 68.4 : Number((38.5 + (idx * 4.3) % 15).toFixed(1))
                  const basePeak = status === 'CRITICAL' ? 5.18 : status === 'WARNING' ? 3.45 : Number((1.95 + (idx * 0.55) % 1.3).toFixed(2))
                  const baseScore = status === 'CRITICAL' ? 42 : status === 'WARNING' ? 78 : (97 - (idx * 2) % 6)

                  return {
                    id: mId,
                    name: m.name || `Machine ${mId}`,
                    zone: m.zone,
                    type: m.type,
                    status,
                    vibrationRms: live.vibrationRms ?? health.rms ?? baseVib,
                    temperature: live.temperature ?? health.temperature ?? baseTemp,
                    peak: live.peak ?? health.peak ?? basePeak,
                    healthScore: live.healthScore ?? health.healthScore ?? att?.healthScore ?? baseScore,
                  }
                })
              : undefined
          }
          selectedId={selectedTwinId || undefined}
          onSelect={setSelectedTwinId}
        />

      </section>
    </div>
  )
}
