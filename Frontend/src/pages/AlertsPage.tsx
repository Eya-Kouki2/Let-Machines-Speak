import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { getAlerts, getUnreadAlertCount, markAlertRead, markAllAlertsRead, type AlertRecord } from '../services/alertsApi'

const severityMap: Record<string, string> = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',
}

const categoryMap: Record<string, string> = {
  MACHINE: 'Machine',
  WORKER_SAFETY: 'Worker Safety',
  USER: 'User',
  SYSTEM: 'System',
}

function formatTime(value?: string): string {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function AlertsPage() {
  const socket = useSocket()
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'safety'>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [updating, setUpdating] = useState(false)

  const loadAlerts = async (nextPage = page) => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page: nextPage, limit: 8 }
      if (filter === 'unread') params.read = 'unread'
      if (filter === 'critical') params.severity = 'CRITICAL'
      if (filter === 'safety') params.category = 'WORKER_SAFETY'

      const result = await getAlerts(params)
      setAlerts(result.items)
      setTotalPages(result.totalPages || 1)
      setPage(result.page || 1)
    } catch (error) {
      console.error('Unable to load alerts', error)
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

  const stats = useMemo(() => {
    const critical = alerts.filter((alert) => alert.severity === 'CRITICAL').length
    const unread = alerts.filter((alert) => !alert.readBy?.includes(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id ?? '' : '')).length
    return { critical, unread }
  }, [alerts])

  const handleMarkRead = async (alertId: string) => {
    setUpdating(true)
    try {
      await markAlertRead(alertId)
      await Promise.all([loadAlerts(page), loadUnreadCount()])
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAllRead = async () => {
    setUpdating(true)
    try {
      await markAllAlertsRead()
      await Promise.all([loadAlerts(page), loadUnreadCount()])
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="alerts-page">
      <section className="alerts-header">
        <div>
          <p className="eyebrow">Operations center</p>
          <h1>Alerts & Notifications</h1>
        </div>
        <button type="button" className="labes-btn labes-btn-primary" onClick={handleMarkAllRead} disabled={updating || unreadCount === 0}>
          Mark all read
        </button>
      </section>

      <section className="alerts-kpis">
        <article className="alerts-kpi alert-kpi-critical">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </article>
        <article className="alerts-kpi alert-kpi-warning">
          <span>Critical</span>
          <strong>{stats.critical}</strong>
        </article>
        <article className="alerts-kpi alert-kpi-info">
          <span>Visible</span>
          <strong>{alerts.length}</strong>
        </article>
      </section>

      <section className="alerts-toolbar">
        <div className="alerts-filters" aria-label="Alert filters">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'critical', label: 'Critical' },
            { key: 'safety', label: 'Safety' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={filter === item.key ? 'active' : ''}
              onClick={() => {
                setFilter(item.key as typeof filter)
                setPage(1)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="alerts-list">
        {loading ? (
          <div className="alerts-empty">Loading notifications…</div>
        ) : alerts.length === 0 ? (
          <div className="alerts-empty">No alerts match the current filter.</div>
        ) : (
          alerts.map((alert) => {
            const isUnread = !(alert.readBy ?? []).some((userId) => userId === JSON.parse(localStorage.getItem('user') || '{}').id)
            const severity = severityMap[alert.severity] ?? 'info'
            return (
              <article key={alert._id} className={`alert-item alert-${severity} ${isUnread ? 'unread' : ''}`}>
                <div className="alert-indicator" aria-hidden="true" />
                <div className="alert-copy">
                  <div className="alert-meta-row">
                    <span className={`alert-severity alert-${severity}`}>{alert.severity}</span>
                    <span>{categoryMap[alert.category] ?? alert.category}</span>
                    <time>{formatTime(alert.createdAt)}</time>
                  </div>
                  <h3>{alert.title}</h3>
                  <p>{alert.message}</p>
                </div>
                <div className="alert-actions">
                  {isUnread && (
                    <button type="button" className="labes-btn labes-btn-secondary" onClick={() => void handleMarkRead(alert._id)} disabled={updating}>
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>

      {totalPages > 1 && (
        <div className="alerts-pagination">
          <button type="button" disabled={page <= 1 || loading} onClick={() => {
            const next = Math.max(1, page - 1)
            setPage(next)
            void loadAlerts(next)
          }}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => {
            const next = Math.min(totalPages, page + 1)
            setPage(next)
            void loadAlerts(next)
          }}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
