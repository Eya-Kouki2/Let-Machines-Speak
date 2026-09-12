import React, { useEffect, useState, useCallback } from 'react'
import type { User } from '../types/admin'
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
  LabesDoughnutChart,
  LabesLineChart,
  LabesBarChart,
  LABES_COLORS,
} from '../components/charts/LabesCharts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getUserFromStorage(): User | null {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null') as User | null
  } catch {
    return null
  }
}

function displayFirstName(user: User | null): string {
  if (!user) return 'there'
  return user.firstName || user.name?.split(' ')[0] || 'there'
}

function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

function formatLiveDateTime(date: Date): string {
  const dateFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)

  const timeFormatted = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)

  return `${dateFormatted} · ${timeFormatted}`
}

function isApprovedAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN' && user?.isApproved === true && user?.approvalStatus === 'APPROVED'
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

// Activity severity badge
function SeverityBadge({ severity }: { severity: ActivityItem['severity'] }) {
  const map = {
    CRITICAL: 'db-badge-critical',
    WARNING: 'db-badge-warning',
    INFO: 'db-badge-info',
  }
  return <span className={`db-severity-badge ${map[severity]}`}>{severity}</span>
}

// Quick access card
interface QuickCardProps {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

function QuickCard({ href, label, description, icon, onClick }: QuickCardProps) {
  return (
    <a
      href={href}
      className="db-quick-card"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
    >
      <div className="db-quick-icon">{icon}</div>
      <div className="db-quick-body">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <svg className="db-quick-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
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
  const user = getUserFromStorage()
  const firstName = displayFirstName(user)
  const isAdmin = isApprovedAdmin(user)
  const socket = useSocket()

  // 1. Dynamic Clock: 1-second interval, browser local time, automatic cleanup
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Data State
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [trend, setTrend] = useState<HealthTrendPoint[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [errorSummary, setErrorSummary] = useState<string | null>(null)

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [s, a, t] = await Promise.all([
        getDashboardSummary(),
        getRecentActivity(8),
        getHealthTrend(),
      ])
      setSummary(s)
      setActivity(a)
      setTrend(t)
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

  // Real-Time Socket.IO Synchronization (no manual page reload required)
  useEffect(() => {
    const handleUpdate = () => {
      void loadDashboardData()
    }

    const events = [
      'dashboard:updated',
      'machine:health-updated',
      'machine:created',
      'machine:updated',
      'machine:deleted',
      'safety:event',
      'safety:updated',
      'alert:created',
      'alert:updated',
    ]

    events.forEach((ev) => socket.on(ev, handleUpdate))

    return () => {
      events.forEach((ev) => socket.off(ev, handleUpdate))
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
      <section className="db-header">
        <div className="db-header-left">
          <h1>Dashboard</h1>
          <p>Real-time overview of machine health, worker safety, and active alerts across the plant.</p>
        </div>
        <div className="db-header-right">
          <div className="db-live-badge" title="Real-time Socket.IO connection active">
            <span className="db-live-dot" />
            LIVE
          </div>
          <span className="db-datetime">{formatLiveDateTime(now)}</span>
        </div>
      </section>

      {/* ── Welcome section ── */}
      <section className="db-welcome">
        <div>
          <h2>Welcome back, <span className="db-welcome-name">{firstName}.</span></h2>
          <p>Here is the latest live status from your industrial sensors and AI models.</p>
        </div>
        {user?.role && (
          <span className="db-role-badge">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span>
        )}
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
              icon={Icons.checkCircle}
              label="Healthy Machines"
              value={summary.machines.healthy}
              sub={
                summary.machines.total > 0
                  ? `${Math.round((summary.machines.healthy / summary.machines.total) * 100)}% of fleet`
                  : 'No machines'
              }
              accent="green"
              clickable
              onClick={() => navigate('Machine Health', '#machine-health?status=healthy')}
            />
            <KpiCard
              icon={Icons.alertTriangle}
              label="Machines in Warning"
              value={summary.machines.warning}
              sub="inspect condition"
              accent={summary.machines.warning > 0 ? 'orange' : 'green'}
              clickable
              onClick={() => navigate('Machine Health', '#machine-health?status=warning')}
            />
            <KpiCard
              icon={Icons.alertTriangle}
              label="Critical Machines"
              value={summary.machines.critical}
              sub="immediate action required"
              accent={summary.machines.critical > 0 ? 'red' : 'green'}
              clickable
              onClick={() => navigate('Machine Health', '#machine-health?status=critical')}
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
              icon={Icons.bell}
              label="Active Alerts"
              value={summary.alerts.active}
              sub={`${summary.alerts.critical} critical severity`}
              accent={summary.alerts.critical > 0 ? 'red' : summary.alerts.active > 0 ? 'orange' : 'green'}
              clickable
              onClick={() => navigate('Alerts', '#alerts')}
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
            />
          </>
        ) : null}
      </section>

      {/* ── 4 Main Visuals Row ── */}
      <section className="db-charts-grid-4">
        {/* Visual 1: Machine Status Distribution (Chart.js Doughnut) */}
        <article className="db-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-green">{Icons.cpu}</div>
            <div>
              <h2>Machine Status Distribution</h2>
              <p>Fleet breakdown by operational health state</p>
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
                size={140}
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

        {/* Visual 2: Average Health Score Trend (Chart.js Line) */}
        <article className="db-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-green">{Icons.activity}</div>
            <div>
              <h2>Average Health Score Trend</h2>
              <p>Hourly 24-hour fleet composite health</p>
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
                    fillColor: 'rgba(16, 185, 129, 0.1)',
                  },
                ]}
                yMin={0}
                yMax={100}
                yUnit="%"
                height={175}
              />
              <div className="db-trend-footer">
                <span>Latest: <strong>{trend[trend.length - 1].avgScore}%</strong></span>
                <span>Low: <strong>{Math.min(...trendData)}%</strong></span>
                <span>High: <strong>{Math.max(...trendData)}%</strong></span>
              </div>
            </div>
          )}
        </article>

        {/* Visual 3: Machines Requiring Attention (Compact ranked list) */}
        <article className="db-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-orange">{Icons.alertTriangle}</div>
            <div>
              <h2>Machines Requiring Attention</h2>
              <p>Ranked assets with active warnings or degraded health</p>
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
              <p>No critical or warning thresholds currently breached.</p>
            </div>
          )}
        </article>

        {/* Visual 4: Safety Events by Type (Chart.js Bar) */}
        <article className="db-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-orange">{Icons.shield}</div>
            <div>
              <h2>Safety Events Today</h2>
              <p>Incidents categorized by computer vision detection</p>
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
                height={175}
                yUnit=" events"
              />
              <div className="db-safety-insight">
                {summary && summary.safety?.activeViolations === 0 ? (
                  <span className="db-insight-ok">✓ All zones compliant and secure</span>
                ) : (
                  <span className="db-insight-warn">
                    ⚠ {summary?.safety?.activeViolations ?? 0} active open violation{(summary?.safety?.activeViolations ?? 0) > 1 ? 's' : ''}
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
      </section>

      {/* ── Recent Activity + Quick Access Row ── */}
      <section className="db-bottom-row">
        {/* Recent Activity */}
        <article className="db-panel db-activity-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-green">{Icons.bell}</div>
            <div>
              <h2>Recent Activity</h2>
              <p>Live event log from IoT telemetry and safety cameras</p>
            </div>
          </div>

          {loadingActivity ? (
            <div className="db-panel-loading">Loading live stream…</div>
          ) : activity.length === 0 ? (
            <div className="db-panel-empty">No recent activity</div>
          ) : (
            <ul className="db-activity-list">
              {activity.map((item, idx) => (
                <li key={idx} className="db-activity-item">
                  <SeverityBadge severity={item.severity} />
                  <div className="db-activity-body">
                    <strong>{item.title}</strong>
                    <span>{item.source}</span>
                  </div>
                  <span className="db-activity-time">{timeAgo(item.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Quick Access */}
        <article className="db-panel db-quick-panel">
          <div className="db-panel-header">
            <div className="db-panel-icon db-panel-icon-green">{Icons.settings}</div>
            <div>
              <h2>Quick Access</h2>
              <p>Direct navigation to system modules</p>
            </div>
          </div>

          <div className="db-quick-list">
            <QuickCard
              href="#machine-health"
              label="Machine Health"
              description="Fleet condition, vibration RMS & AI predictions"
              icon={Icons.cpu}
              onClick={() => navigate('Machine Health', '#machine-health')}
            />
            <QuickCard
              href="#safety"
              label="Worker Safety"
              description="Live PPE inspection and restricted zone alerts"
              icon={Icons.shield}
              onClick={() => navigate('Safety', '#safety')}
            />
            <QuickCard
              href="#profile"
              label="Profile"
              description="Manage user credentials and work zone"
              icon={Icons.user}
              onClick={() => navigate('Profile', '#profile')}
            />
            {isAdmin && (
              <>
                <QuickCard
                  href="#users"
                  label="User Management"
                  description="Review pending approvals and grant admin roles"
                  icon={Icons.users}
                  onClick={() => navigate('Users', '#users')}
                />
                <QuickCard
                  href="#machine-management"
                  label="Machine Management"
                  description="Configure machine parameters and threshold values"
                  icon={Icons.settings}
                  onClick={() => navigate('Machine Management', '#machine-management')}
                />
              </>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
