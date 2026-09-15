import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { getAlerts, getUnreadAlertCount, markAlertRead, markAllAlertsRead, type AlertRecord } from '../services/alertsApi'

const categoryMap: Record<string, string> = {
  MACHINE: 'Machine Fleet',
  WORKER_SAFETY: 'Worker Safety',
  USER: 'User & Auth',
  SYSTEM: 'System & Edge',
}

function timeAgo(iso?: string): string {
  if (!iso) return 'Just now'
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function AlertsPage() {
  const socket = useSocket()
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning' | 'safety' | 'machine'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [updating, setUpdating] = useState(false)

  // Get current user id from storage for unread check
  const currentUserId = useMemo(() => {
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return ''
      const parsed = JSON.parse(stored) as { id?: string; _id?: string }
      return parsed.id || parsed._id || ''
    } catch {
      return ''
    }
  }, [])

  const loadAlerts = async (nextPage = page) => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page: nextPage, limit: 10 }
      if (filter === 'unread') params.read = 'unread'
      if (filter === 'critical') params.severity = 'CRITICAL'
      if (filter === 'warning') params.severity = 'WARNING'
      if (filter === 'safety') params.category = 'WORKER_SAFETY'
      if (filter === 'machine') params.category = 'MACHINE'

      const result = await getAlerts(params)
      setAlerts(result.items || [])
      setTotalPages(result.totalPages || 1)
      setTotalAlerts(result.total || result.items?.length || 0)
      setPage(result.page || 1)
    } catch (error) {
      console.error('Unable to load alerts', error)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadAlertCount()
      setUnreadCount(result.count || 0)
    } catch (error) {
      console.error('Unable to load unread alert count', error)
    }
  }

  useEffect(() => {
    void loadAlerts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    void loadUnreadCount()
  }, [])

  useEffect(() => {
    const handleAlertUpdate = () => {
      void loadAlerts(page)
      void loadUnreadCount()
    }

    socket.on('alert:created', handleAlertUpdate)
    socket.on('alert:updated', handleAlertUpdate)

    return () => {
      socket.off('alert:created', handleAlertUpdate)
      socket.off('alert:updated', handleAlertUpdate)
    }
  }, [page, socket])

  // Computed metrics across current loaded alerts
  const stats = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === 'CRITICAL').length
    const warning = alerts.filter((a) => a.severity === 'WARNING').length
    const safety = alerts.filter((a) => a.category === 'WORKER_SAFETY' || a.type?.includes('SAFETY')).length
    const machine = alerts.filter((a) => a.category === 'MACHINE' || a.sourceType === 'machine').length
    return { critical, warning, safety, machine }
  }, [alerts])

  const handleMarkRead = async (alertId: string) => {
    setUpdating(true)
    try {
      await markAlertRead(alertId)
      await Promise.all([loadAlerts(page), loadUnreadCount()])
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAllRead = async () => {
    setUpdating(true)
    try {
      await markAllAlertsRead()
      await Promise.all([loadAlerts(page), loadUnreadCount()])
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Client-side search filtering
  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts
    const q = searchQuery.toLowerCase()
    return alerts.filter((a) => {
      return (
        a.title?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        a.severity?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.sourceId?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q)
      )
    })
  }, [alerts, searchQuery])

  return (
    <div className="alerts-page-shell safety-page-shell">
      {/* ── 1. Page Header (Matching Worker Safety Title Design) ── */}
      <div className="safety-page-header">
        <h1 className="safety-page-title">Alerts &amp; Notifications</h1>
        <div className="alerts-header-actions">

          <button
            type="button"
            className="safety-btn-export-pdf"
            onClick={handleMarkAllRead}
            disabled={updating || unreadCount === 0}
            title={unreadCount === 0 ? 'No unread alerts' : 'Mark all alerts as read'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{updating ? 'Updating…' : 'Mark All Read'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Metrics Summary Cards ("Chiffres") ── */}
      <section className="safety-kpi-grid">
        {/* Unread Alerts */}
        <div className={`safety-kpi-card ${unreadCount > 0 ? 'kpi-danger' : 'kpi-success'}`}>
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Unread Alerts</span>
            <strong className="safety-kpi-value">{unreadCount}</strong>
            <small className="safety-kpi-sub">
              {unreadCount > 0 ? 'Requires operator review' : 'All notifications cleared'}
            </small>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className={`safety-kpi-card ${stats.critical > 0 ? 'kpi-danger' : 'kpi-emerald'}`}>
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Critical Incidents</span>
            <strong className="safety-kpi-value">{stats.critical}</strong>
            <small className="safety-kpi-sub">High-priority alerts</small>
          </div>
        </div>

        {/* Safety Incidents */}
        <div className="safety-kpi-card kpi-orange">
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Safety Incidents</span>
            <strong className="safety-kpi-value">{stats.safety}</strong>
            <small className="safety-kpi-sub">Zone &amp; PPE violations</small>
          </div>
        </div>

        {/* Monitored Events */}
        <div className="safety-kpi-card kpi-mint">
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="2" />
              <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Total Logged</span>
            <strong className="safety-kpi-value">{totalAlerts}</strong>
            <small className="safety-kpi-sub">Telemetry &amp; system feed</small>
          </div>
        </div>
      </section>

      {/* ── 3. Modern Toolbar: Search & Filter Chips ── */}
      <section className="alerts-search-filter-toolbar">
        {/* Search input */}
        <div className="alerts-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search alerts by title, machine, or message…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="alerts-filters-group" role="tablist" aria-label="Alert filters">
          {[
            { key: 'all', label: 'All', count: totalAlerts },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'critical', label: 'Critical', count: stats.critical },
            { key: 'warning', label: 'Warning', count: stats.warning },
            { key: 'safety', label: 'Safety', count: stats.safety },
            { key: 'machine', label: 'Machines', count: stats.machine },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={filter === item.key}
              className={`alert-filter-pill ${filter === item.key ? 'active' : ''}`}
              onClick={() => {
                setFilter(item.key as typeof filter)
                setPage(1)
              }}
            >
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="alert-pill-count">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Alerts Feed List ── */}
      <section className="alerts-feed-grid">
        {loading ? (
          <div className="safety-loading-card">
            <div className="safety-loading-spinner" />
            <p>Retrieving real-time fleet &amp; safety notifications…</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="alerts-empty-state">
            <div className="alerts-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="24" height="24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>All Nominal &amp; Clear</h3>
            <p>
              {searchQuery
                ? `No alerts matched your search "${searchQuery}".`
                : 'No alerts match the selected filter category.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnread =
              !currentUserId ||
              !alert.readBy ||
              !alert.readBy.includes(currentUserId)

            const isCrit = alert.severity === 'CRITICAL'
            const isWarn = alert.severity === 'WARNING'
            const isSafety = alert.category === 'WORKER_SAFETY' || alert.type?.includes('SAFETY')

            const stripeClass = isCrit
              ? 'stripe-critical'
              : isSafety
                ? 'stripe-safety'
                : isWarn
                  ? 'stripe-warning'
                  : 'stripe-info'

            const iconClass = isCrit
              ? 'icon-critical'
              : isSafety
                ? 'icon-safety'
                : isWarn
                  ? 'icon-warning'
                  : 'icon-info'

            const chipClass = isCrit
              ? 'chip-critical'
              : isSafety
                ? 'chip-safety'
                : isWarn
                  ? 'chip-warning'
                  : 'chip-info'

            return (
              <article
                key={alert._id}
                className={`modern-alert-card ${isUnread ? 'is-unread' : ''}`}
              >
                {/* Visual Indicator Stripe */}
                <div className={`alert-card-stripe ${stripeClass}`} aria-hidden="true" />

                {/* Left Icon */}
                <div className={`alert-card-icon-wrap ${iconClass}`}>
                  {isCrit ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : isSafety ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ) : isWarn ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </div>

                {/* Content & Metadata */}
                <div className="alert-card-content">
                  <div className="alert-card-meta">
                    <span className={`alert-badge-chip ${chipClass}`}>{alert.severity}</span>
                    <span className="alert-badge-chip chip-category">
                      {categoryMap[alert.category] ?? alert.category}
                    </span>
                    {alert.sourceId && (
                      <span className="alert-badge-chip chip-machine">
                        ID: {alert.sourceId}
                      </span>
                    )}
                    {isUnread && (
                      <span
                        className="alert-badge-chip"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                      >
                        NEW
                      </span>
                    )}
                    <span className="alert-card-time" title={alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}>
                      {timeAgo(alert.createdAt)}
                    </span>
                  </div>
                  <h3 className="alert-card-title">{alert.title}</h3>
                  <p className="alert-card-msg">{alert.message}</p>
                </div>

                {/* Right Action */}
                <div className="alert-card-actions">
                  {isUnread && (
                    <button
                      type="button"
                      className="alert-btn-mark-read"
                      onClick={() => void handleMarkRead(alert._id)}
                      disabled={updating}
                      title="Mark as read"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>

      {/* ── 5. Modern Pagination ── */}
      {totalPages > 1 && (
        <footer className="alerts-pagination-bar">
          <button
            type="button"
            className="alerts-page-nav-btn"
            disabled={page <= 1 || loading}
            onClick={() => {
              const next = Math.max(1, page - 1)
              setPage(next)
              void loadAlerts(next)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Previous</span>
          </button>

          <span className="alerts-page-indicator">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalAlerts} alerts)
          </span>

          <button
            type="button"
            className="alerts-page-nav-btn"
            disabled={page >= totalPages || loading}
            onClick={() => {
              const next = Math.min(totalPages, page + 1)
              setPage(next)
              void loadAlerts(next)
            }}
          >
            <span>Next</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </footer>
      )}
    </div>
  )
}
