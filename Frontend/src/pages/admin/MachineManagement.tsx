import { useEffect, useMemo, useState } from 'react'
import { defaultThresholds, machinesApi } from '../../services/machinesApi'
import type { ManagedMachine } from '../../types/admin'

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

export function MachineManagement() {
  const [machines, setMachines] = useState<ManagedMachine[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<ManagedMachine>(emptyMachine)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadMachines() {
    setError('')
    try {
      setMachines(await machinesApi.list())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load machines')
    }
  }

  useEffect(() => { void loadMachines() }, [])

  const filteredMachines = useMemo(() => machines.filter((machine) =>
    `${machine.name} ${machine.machineId} ${machine.zone} ${machine.status}`.toLowerCase().includes(query.toLowerCase())
  ), [machines, query])

  function updateThreshold(group: keyof ManagedMachine['thresholds'], field: 'warning' | 'critical', value: string) {
    setForm({
      ...form,
      thresholds: {
        ...form.thresholds,
        [group]: { ...form.thresholds[group], [field]: Number(value) },
      },
    })
  }

  async function saveMachine(event: React.FormEvent) {
    event.preventDefault()
    if (editingId) await machinesApi.update(editingId, form)
    else await machinesApi.create(form)
    setForm(emptyMachine)
    setEditingId(null)
    await loadMachines()
  }

  async function deleteMachine(machine: ManagedMachine) {
    if (!window.confirm(`Delete ${machine.name}? This action cannot be undone.`)) return
    await machinesApi.remove(machine.machineId)
    await loadMachines()
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Machine Management</h1>
          <p>Admin-only machine identity, zones, status, and thresholds.</p>
        </div>
        <input className="admin-input" placeholder="Search machines..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {error && <div className="admin-error">{error}</div>}
      <form className="admin-card admin-machine-form" onSubmit={saveMachine}>
        <input className="admin-input" placeholder="Machine Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="admin-input" placeholder="Machine ID" value={form.machineId} onChange={(event) => setForm({ ...form, machineId: event.target.value })} required />
        <input className="admin-input" placeholder="Machine Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
        <input className="admin-input" placeholder="Zone" value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })} required />
        <input className="admin-input admin-wide" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        {Object.entries(form.thresholds).map(([group, pair]) => (
          <div className="admin-threshold-row" key={group}>
            <strong>{group}</strong>
            <label>Warning <input type="number" step="0.01" value={pair.warning} onChange={(event) => updateThreshold(group as keyof ManagedMachine['thresholds'], 'warning', event.target.value)} /></label>
            <label>Critical <input type="number" step="0.01" value={pair.critical} onChange={(event) => updateThreshold(group as keyof ManagedMachine['thresholds'], 'critical', event.target.value)} /></label>
          </div>
        ))}
        <button className="btn-go-dashboard" type="submit">{editingId ? 'Save Machine' : 'Add Machine'}</button>
      </form>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Machine</th><th>Machine ID</th><th>Type</th><th>Zone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredMachines.map((machine) => (
              <tr key={machine.machineId}>
                <td>{machine.name}</td><td>{machine.machineId}</td><td>{machine.type}</td><td>{machine.zone}</td><td>{machine.status}</td>
                <td>
                  <button type="button" onClick={() => { setForm(machine); setEditingId(machine.machineId) }}>Edit</button>
                  <button type="button" onClick={() => void deleteMachine(machine)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
