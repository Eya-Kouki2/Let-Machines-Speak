import { useEffect, useMemo, useState } from 'react'
import { usersApi } from '../../services/usersApi'
import type { ApprovalStatus, User, UserRole } from '../../types/admin'

const roles: UserRole[] = ['USER', 'ADMIN']
const approvalStatuses: Array<ApprovalStatus | 'ALL'> = ['ALL', 'APPROVED', 'PENDING', 'REJECTED']
const statusFilters = ['ALL', 'ACTIVE', 'INACTIVE'] as const

type StatusFilter = typeof statusFilters[number]

type UserForm = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  age: string
  yearsOfExperience: string
  workZone: string
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'USER',
  age: '',
  yearsOfExperience: '',
  workZone: '',
}

function Badge({ value }: { value: string }) {
  return <span className={`admin-badge admin-badge-${value.toLowerCase()}`}>{value}</span>
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<UserForm>(emptyForm)

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      setUsers(await usersApi.list())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadUsers() }, [])

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.active).length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    pending: users.filter((user) => user.role === 'ADMIN' && user.approvalStatus === 'PENDING').length,
  }), [users])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesApproval = approvalFilter === 'ALL' || user.approvalStatus === approvalFilter
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? user.active : !user.active)
    return matchesSearch && matchesRole && matchesApproval && matchesStatus
  }), [approvalFilter, query, roleFilter, statusFilter, users])

  async function createUser(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    await usersApi.create({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      age: form.age ? Number(form.age) : undefined,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      workZone: form.workZone,
    })
    setSuccess(form.role === 'ADMIN' ? 'Admin account created as pending approval.' : 'User account created.')
    setForm(emptyForm)
    await loadUsers()
  }

  async function updateUser(user: User, patch: Partial<User>) {
    setError('')
    setSuccess('')
    if (patch.role === 'ADMIN' && !window.confirm(`${user.name} will become a pending admin request until approved. Continue?`)) return
    await usersApi.update(user.id, patch)
    setSuccess('User updated.')
    await loadUsers()
  }

  async function approveUser(user: User) {
    if (!window.confirm(`Approve admin access for ${user.name}?`)) return
    await usersApi.approveAdmin(user.id)
    setSuccess(`${user.name} approved as admin.`)
    await loadUsers()
  }

  async function rejectUser(user: User) {
    if (!window.confirm(`Reject admin request for ${user.name}?`)) return
    await usersApi.rejectAdmin(user.id)
    setSuccess(`${user.name} admin request rejected.`)
    await loadUsers()
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) return
    await usersApi.remove(user.id)
    setSuccess('User deleted.')
    await loadUsers()
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
          <p>Manage users, account status, and admin approval requests in one place.</p>
        </div>
        <input className="admin-input" placeholder="Search name or email..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card"><span>Total Users</span><strong>{summary.total}</strong></div>
        <div className="admin-summary-card"><span>Active Users</span><strong>{summary.active}</strong></div>
        <div className="admin-summary-card"><span>Admins</span><strong>{summary.admins}</strong></div>
        <div className="admin-summary-card"><span>Pending Admins</span><strong>{summary.pending}</strong></div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <form className="admin-card admin-form admin-form-expanded" onSubmit={createUser}>
        <input className="admin-input" placeholder="Full Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="admin-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <input className="admin-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
        <input className="admin-input" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required minLength={8} />
        <select className="admin-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
          {roles.map((role) => <option key={role} value={role}>{role === 'USER' ? 'User' : 'Admin'}</option>)}
        </select>
        <input className="admin-input" type="number" min="18" placeholder="Age" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
        <input className="admin-input" type="number" min="0" placeholder="Years of Experience" value={form.yearsOfExperience} onChange={(event) => setForm({ ...form, yearsOfExperience: event.target.value })} />
        <input className="admin-input" placeholder="Work Zone" value={form.workZone} onChange={(event) => setForm({ ...form, workZone: event.target.value })} />
        {form.role === 'ADMIN' && <p className="admin-form-note">Admin accounts are created as pending and require approval from another approved admin.</p>}
        <button className="btn-go-dashboard" type="submit">Add User</button>
      </form>

      <div className="admin-card admin-filter-row">
        <select className="admin-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'ALL')}>
          <option value="ALL">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select className="admin-input" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as ApprovalStatus | 'ALL')}>
          {approvalStatuses.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All approval' : status}</option>)}
        </select>
        <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          {statusFilters.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All status' : status}</option>)}
        </select>
      </div>

      <div className="admin-card">
        {loading ? <p>Loading users...</p> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Account Status</th><th>Approval Status</th><th>Created At</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(event) => void updateUser(user, { role: event.target.value as UserRole })}>
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td><Badge value={user.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td><Badge value={user.approvalStatus || 'APPROVED'} /></td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="admin-actions">
                    {user.role === 'ADMIN' && user.approvalStatus === 'PENDING' && (
                      <>
                        <button type="button" onClick={() => void approveUser(user)}>Approve</button>
                        <button type="button" onClick={() => void rejectUser(user)}>Reject</button>
                      </>
                    )}
                    <button type="button" onClick={() => void updateUser(user, { active: !user.active })}>{user.active ? 'Deactivate' : 'Activate'}</button>
                    <button type="button" onClick={() => void deleteUser(user)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
