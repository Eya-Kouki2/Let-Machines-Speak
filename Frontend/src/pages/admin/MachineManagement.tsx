import { useEffect, useMemo, useState } from 'react'
import { defaultThresholds, machinesApi } from '../../services/machinesApi'
import type { ManagedMachine, MachineThresholds } from '../../types/admin'

const thresholdLabels: Record<keyof MachineThresholds, { label: string; unit: string; hint: string }> = {
  vibrationRms: { label: 'Vibration RMS', unit: 'mm/s', hint: 'Early warning / serious vibration' },
  peakAcceleration: { label: 'Peak Acceleration', unit: 'g', hint: 'Impact and shock threshold' },
  temperature: { label: 'Temperature', unit: '°C', hint: 'Thermal warning / thermal alarm' },
  current: { label: 'Current', unit: 'A', hint: 'Load and overdraw threshold' },
  anomalyScore: { label: 'Anomaly Score', unit: '0–1', hint: 'Model confidence / anomaly level' },
}

const emptyMachine: ManagedMachine = {
  machineId: '',
  name: '',
  type: '',
  zone: '',
  description: '',
  enabled: true,
  status: 'OFFLINE',
  thresholds: defaultThresholds,
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusTone(status: ManagedMachine['status']) {
  switch (status) {
    case 'ONLINE': return 'admin-status-online'
    case 'WARNING': return 'admin-status-warning'
    case 'CRITICAL': return 'admin-status-critical'
    default: return 'admin-status-offline'
  }
}

export function MachineManagement() {
  const [machines, setMachines] = useState<ManagedMachine[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ManagedMachine['status']>('ALL')
  const [zoneFilter, setZoneFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMachine, setEditingMachine] = useState<ManagedMachine | null>(null)
  const [draft, setDraft] = useState<ManagedMachine>(emptyMachine)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string
    description: string
    actionLabel: string
    danger?: boolean
    onConfirm: () => Promise<void> | void
  }>(null)

  async function loadMachines() {
    setLoading(true)
    setError('')
    try {
      setMachines(await machinesApi.list())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load machines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadMachines() }, [])

  const summary = useMemo(() => ({
    total: machines.length,
    online: machines.filter((machine) => machine.status === 'ONLINE').length,
    warning: machines.filter((machine) => machine.status === 'WARNING').length,
    critical: machines.filter((machine) => machine.status === 'CRITICAL').length,
    offline: machines.filter((machine) => machine.status === 'OFFLINE').length,
  }), [machines])

  const zoneOptions = useMemo(() => Array.from(new Set(machines.map((machine) => machine.zone).filter(Boolean))), [machines])

  const filteredMachines = useMemo(() => machines.filter((machine) => {
    const matchesSearch = `${machine.name} ${machine.machineId} ${machine.type} ${machine.zone}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter
    const matchesZone = zoneFilter === 'ALL' || machine.zone === zoneFilter
    return matchesSearch && matchesStatus && matchesZone
  }), [machines, query, statusFilter, zoneFilter])

  function openCreateModal() {
    setEditingMachine(null)
    setDraft(emptyMachine)
    setShowModal(true)
  }

  function openEditModal(machine: ManagedMachine) {
    setEditingMachine(machine)
    setDraft({ ...machine, thresholds: { ...defaultThresholds, ...machine.thresholds } })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingMachine(null)
    setDraft(emptyMachine)
  }

  function updateThreshold(group: keyof ManagedMachine['thresholds'], field: 'warning' | 'critical', value: string) {
    const numeric = Number(value)
    setDraft((current) => ({
      ...current,
      thresholds: {
        ...current.thresholds,
        [group]: {
          ...current.thresholds[group],
          [field]: Number.isFinite(numeric) ? numeric : 0,
        },
      },
    }))
  }

  async function saveMachine(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    for (const [key, config] of Object.entries(draft.thresholds) as Array<[keyof ManagedMachine['thresholds'], { warning: number; critical: number }]>) {
      if (config.critical <= config.warning) {
        setError(`${thresholdLabels[key].label}: Critical threshold must be greater than warning.`)
        return
      }
    }

    try {
      const payload = {
        ...draft,
        name: draft.name.trim(),
        machineId: draft.machineId.trim(),
        type: draft.type?.trim() ?? '',
        zone: draft.zone.trim(),
        description: draft.description?.trim() ?? '',
      }

      if (editingMachine) {
        await machinesApi.update(editingMachine.machineId, payload)
        setSuccess('Machine updated successfully.')
      } else {
        await machinesApi.create(payload)
        setSuccess('Machine created successfully.')
      }
      closeModal()
      await loadMachines()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save machine.')
    }
  }

  async function deleteMachine(machine: ManagedMachine) {
    setConfirmAction({
      title: 'Delete this machine?',
      description: `This removes ${machine.name} from the fleet. This action cannot be undone.`,
      actionLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await machinesApi.remove(machine.machineId)
          setSuccess('Machine deleted successfully.')
          setMenuOpenId(null)
          setConfirmAction(null)
          await loadMachines()
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete machine.')
          setConfirmAction(null)
        }
      },
    })
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-header-block">
        <div>
          <p className="admin-kicker">Machine Management</p>
          <h1>Manage machine identity, zones, operating status, and monitoring thresholds.</h1>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-green">M</div>
          <div className="admin-kpi-meta">
            <span>Total Machines</span>
            <strong>{summary.total}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-emerald">O</div>
          <div className="admin-kpi-meta">
            <span>Online</span>
            <strong>{summary.online}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-warning">W</div>
          <div className="admin-kpi-meta">
            <span>Warning</span>
            <strong>{summary.warning}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-critical">C</div>
          <div className="admin-kpi-meta">
            <span>Critical</span>
            <strong>{summary.critical}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-muted">X</div>
          <div className="admin-kpi-meta">
            <span>Offline</span>
            <strong>{summary.offline}</strong>
          </div>
        </div>
      </div>

      {error && <div className="admin-banner admin-banner-error">{error}</div>}
      {success && <div className="admin-banner admin-banner-success">{success}</div>}

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <input className="admin-input" placeholder="Search machines..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="admin-toolbar-filters">
          <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | ManagedMachine['status'])}>
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
            <option value="OFFLINE">Offline</option>
          </select>
          <select className="admin-input" value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
            <option value="ALL">All Zones</option>
            {zoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>+ Add Machine</button>
      </div>

      <div className="admin-card admin-table-card">
        {loading ? (
          <div className="admin-empty-state">Loading machines...</div>
        ) : filteredMachines.length === 0 ? (
          <div className="admin-empty-state">No machines found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Machine ID</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map((machine) => (
                <tr key={machine.machineId}>
                  <td>
                    <div className="admin-machine-cell">
                      <div className="admin-machine-bullet" />
                      <div>
                        <strong>{machine.name}</strong>
                        <span>{machine.type || 'Unassigned type'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{machine.machineId}</td>
                  <td>{machine.type || '—'}</td>
                  <td>{machine.zone}</td>
                  <td><span className={`admin-badge ${statusTone(machine.status)}`}>{machine.status}</span></td>
                  <td>{formatDate(machine.lastSeen)}</td>
                  <td>
                    <div className="admin-action-menu-wrap">
                      <button type="button" className="admin-menu-trigger" onClick={() => setMenuOpenId((current) => current === machine.machineId ? null : machine.machineId)}>
                        ⋯
                      </button>
                      {menuOpenId === machine.machineId && (
                        <div className="admin-action-menu">
                          <button type="button" onClick={() => { window.location.hash = `#machine-health/${machine.machineId}`; setMenuOpenId(null) }}>View Health</button>
                          <button type="button" onClick={() => { openEditModal(machine); setMenuOpenId(null) }}>Edit</button>
                          <button type="button" onClick={() => { setDraft({ ...machine, thresholds: { ...defaultThresholds, ...machine.thresholds } }); setShowModal(true); setMenuOpenId(null) }}>Thresholds</button>
                          <button type="button" className="admin-action-danger" onClick={() => { void deleteMachine(machine); setMenuOpenId(null) }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal admin-modal-wide" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="admin-kicker">{editingMachine ? 'Edit Machine' : 'Add Machine'}</p>
                <h3>{editingMachine ? 'Update machine details' : 'Create a new machine'}</h3>
              </div>
              <button type="button" className="admin-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={saveMachine} className="admin-form-modal">
              <div className="admin-form-section">
                <h4>Machine Information</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Machine Name</span>
                    <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
                  </label>
                  <label className="admin-field">
                    <span>Machine ID</span>
                    <input value={draft.machineId} onChange={(event) => setDraft({ ...draft, machineId: event.target.value })} required />
                  </label>
                  <label className="admin-field">
                    <span>Machine Type</span>
                    <input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} />
                  </label>
                  <label className="admin-field">
                    <span>Zone</span>
                    <input value={draft.zone} onChange={(event) => setDraft({ ...draft, zone: event.target.value })} required />
                  </label>
                  <label className="admin-field admin-field-full">
                    <span>Description</span>
                    <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} />
                  </label>
                </div>
              </div>

              <div className="admin-form-section">
                <h4>Monitoring Thresholds</h4>
                <div className="admin-threshold-grid">
                  {(Object.keys(thresholdLabels) as Array<keyof MachineThresholds>).map((key) => {
                    const threshold = draft.thresholds[key]
                    const meta = thresholdLabels[key]
                    return (
                      <div key={key} className="admin-threshold-card">
                        <div className="admin-threshold-header">
                          <strong>{meta.label}</strong>
                          <span>{meta.unit}</span>
                        </div>
                        <small>{meta.hint}</small>
                        <div className="admin-threshold-pair">
                          <label>
                            <span>Warning</span>
                            <input type="number" step="0.01" value={threshold.warning} onChange={(event) => updateThreshold(key, 'warning', event.target.value)} />
                          </label>
                          <label>
                            <span>Critical</span>
                            <input type="number" step="0.01" value={threshold.critical} onChange={(event) => updateThreshold(key, 'critical', event.target.value)} />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="admin-form-section">
                <h4>Status</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Current Status</span>
                    <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ManagedMachine['status'] })}>
                      <option value="ONLINE">Online</option>
                      <option value="WARNING">Warning</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </label>
                  <label className="admin-toggle-field">
                    <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-primary-btn">{editingMachine ? 'Save Machine' : 'Create Machine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="admin-confirm" onClick={(event) => event.stopPropagation()}>
            <h3>{confirmAction.title}</h3>
            <p>{confirmAction.description}</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-secondary-btn" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button type="button" className={`admin-primary-btn ${confirmAction.danger ? 'admin-danger-btn' : ''}`} onClick={() => { void confirmAction.onConfirm() }}>
                {confirmAction.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

