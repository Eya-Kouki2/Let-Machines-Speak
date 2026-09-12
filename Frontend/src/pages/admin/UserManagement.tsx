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

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function badgeClassForAccountStatus(active: boolean) {
  return active ? 'admin-badge-active' : 'admin-badge-inactive'
}

function badgeClassForApprovalStatus(status: ApprovalStatus) {
  if (status === 'PENDING') return 'admin-badge-pending'
  if (status === 'REJECTED') return 'admin-badge-rejected'
  return 'admin-badge-approved'
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [draft, setDraft] = useState<UserForm>(emptyForm)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string
    description: string
    actionLabel: string
    danger?: boolean
    onConfirm: () => Promise<void> | void
  }>(null)

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
    const value = `${user.name} ${user.email} ${user.role}`.toLowerCase()
    const matchesSearch = value.includes(query.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesApproval = approvalFilter === 'ALL' || user.approvalStatus === approvalFilter
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? user.active : !user.active)
    return matchesSearch && matchesRole && matchesApproval && matchesStatus
  }), [approvalFilter, query, roleFilter, statusFilter, users])

  function openCreateModal() {
    setEditingUser(null)
    setDraft(emptyForm)
    setShowModal(true)
  }

  function openEditModal(user: User) {
    setEditingUser(user)
    setDraft({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      age: user.age?.toString() ?? '',
      yearsOfExperience: user.yearsOfExperience?.toString() ?? '',
      workZone: user.workZone ?? '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingUser(null)
    setDraft(emptyForm)
  }

  async function saveUser(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!draft.name.trim() || !draft.email.trim()) {
      setError('Full name and email are required.')
      return
    }

    if (!editingUser && (!draft.password || !draft.confirmPassword)) {
      setError('Password and confirm password are required.')
      return
    }

    if (!editingUser && draft.password !== draft.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const payload = {
      name: draft.name.trim(),
      email: draft.email.trim().toLowerCase(),
      role: draft.role,
      age: draft.age ? Number(draft.age) : undefined,
      yearsOfExperience: draft.yearsOfExperience ? Number(draft.yearsOfExperience) : undefined,
      workZone: draft.workZone.trim(),
      ...(editingUser ? {} : { password: draft.password }),
    }

    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, payload)
        setSuccess('User updated successfully.')
      } else {
        await usersApi.create(payload)
        setSuccess(draft.role === 'ADMIN' ? 'Admin account created and is pending approval.' : 'User created successfully.')
      }
      closeModal()
      await loadUsers()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save user.')
    }
  }

  async function updateUser(user: User, patch: Partial<User>) {
    setError('')
    setSuccess('')
    try {
      if (patch.role === 'ADMIN' && user.role !== 'ADMIN') {
        setConfirmAction({
          title: 'Update role?',
          description: `${user.name} will be converted to a pending admin request until approved.`,
          actionLabel: 'Continue',
          onConfirm: async () => {
            await usersApi.update(user.id, patch)
            setSuccess('User role updated.')
            setConfirmAction(null)
            await loadUsers()
          },
        })
        return
      }
      await usersApi.update(user.id, patch)
      setSuccess('User updated.')
      await loadUsers()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update user.')
    }
  }

  async function approveUser(user: User) {
    setError('')
    setSuccess('')
    try {
      await usersApi.approveAdmin(user.id)
      setSuccess(`${user.name} approved as admin.`)
      setMenuOpenId(null)
      await loadUsers()
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve admin.')
    }
  }

  async function rejectUser(user: User) {
    setError('')
    setSuccess('')
    try {
      await usersApi.rejectAdmin(user.id)
      setSuccess(`${user.name}'s admin request was rejected.`)
      setMenuOpenId(null)
      await loadUsers()
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Unable to reject admin request.')
    }
  }

  async function deleteUser(user: User) {
    setConfirmAction({
      title: 'Delete this user?',
      description: `This will remove ${user.name} from the system. This action cannot be undone.`,
      actionLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await usersApi.remove(user.id)
          setSuccess('User deleted successfully.')
          setMenuOpenId(null)
          setConfirmAction(null)
          await loadUsers()
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete user.')
          setConfirmAction(null)
        }
      },
    })
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-header-block">
        <div>
          <p className="admin-kicker">User Management</p>
          <h1>Manage users, roles, account status, and admin approvals.</h1>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-green">U</div>
          <div className="admin-kpi-meta">
            <span>Total Users</span>
            <strong>{summary.total}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-emerald">A</div>
          <div className="admin-kpi-meta">
            <span>Active Users</span>
            <strong>{summary.active}</strong>
            <small>{summary.total ? `${Math.round((summary.active / summary.total) * 100)}% active` : '0% active'}</small>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-orange">R</div>
          <div className="admin-kpi-meta">
            <span>Admins</span>
            <strong>{summary.admins}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-warning">P</div>
          <div className="admin-kpi-meta">
            <span>Pending Admins</span>
            <strong>{summary.pending}</strong>
          </div>
        </div>
      </div>

      {error && <div className="admin-banner admin-banner-error">{error}</div>}
      {success && <div className="admin-banner admin-banner-success">{success}</div>}

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <input
            className="admin-input"
            placeholder="Search users..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="admin-toolbar-filters">
          <select className="admin-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'ALL')}>
            <option value="ALL">All Roles</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="admin-input" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as ApprovalStatus | 'ALL')}>
            {approvalStatuses.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All Approval' : status}</option>)}
          </select>
          <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {statusFilters.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All Status' : status}</option>)}
          </select>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>+ Add User</button>
      </div>

      <div className="admin-card admin-table-card">
        {loading ? (
          <div className="admin-empty-state">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-state">No users found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Approval Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.role === 'ADMIN' && user.approvalStatus === 'PENDING' ? 'admin-pending-row' : ''}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{user.name.slice(0, 2).toUpperCase() || 'U'}</div>
                      <div className="admin-user-copy">
                        <strong>{user.name}</strong>
                        <span>{user.role === 'ADMIN' ? 'Administrator' : 'User'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td><span className={`admin-role-badge ${user.role === 'ADMIN' ? 'admin-role-admin' : 'admin-role-user'}`}>{user.role}</span></td>
                  <td><span className={`admin-badge ${badgeClassForAccountStatus(user.active)}`}>{user.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td><span className={`admin-badge ${badgeClassForApprovalStatus(user.approvalStatus || 'APPROVED')}`}>{user.approvalStatus || 'APPROVED'}</span></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="admin-action-menu-wrap">
                      <button type="button" className="admin-menu-trigger" onClick={() => setMenuOpenId((current) => current === user.id ? null : user.id)}>
                        ⋯
                      </button>
                      {menuOpenId === user.id && (
                        <div className="admin-action-menu">
                          <button type="button" onClick={() => { openEditModal(user); setMenuOpenId(null) }}>View</button>
                          <button type="button" onClick={() => { openEditModal(user); setMenuOpenId(null) }}>Edit</button>
                          <button type="button" onClick={() => { void updateUser(user, { active: !user.active }); setMenuOpenId(null) }}>
                            {user.active ? 'Deactivate' : 'Activate'}
                          </button>
                          {user.role === 'ADMIN' && user.approvalStatus === 'PENDING' && (
                            <>
                              <button type="button" onClick={() => { void approveUser(user); setMenuOpenId(null) }}>Approve</button>
                              <button type="button" onClick={() => { void rejectUser(user); setMenuOpenId(null) }}>Reject</button>
                            </>
                          )}
                          <button type="button" className="admin-action-danger" onClick={() => { deleteUser(user); setMenuOpenId(null) }}>Delete</button>
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
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="admin-kicker">{editingUser ? 'Edit User' : 'Add User'}</p>
                <h3>{editingUser ? 'Update account details' : 'Create a new user'}</h3>
              </div>
              <button type="button" className="admin-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={saveUser} className="admin-form-modal">
              <div className="admin-form-section">
                <h4>Account</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Full Name</span>
                    <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
                  </label>
                  <label className="admin-field">
                    <span>Email</span>
                    <input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required />
                  </label>
                  <label className="admin-field">
                    <span>Role</span>
                    <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}>
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {!editingUser && (
                <div className="admin-form-section">
                  <h4>Security</h4>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Password</span>
                      <input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} required />
                    </label>
                    <label className="admin-field">
                      <span>Confirm Password</span>
                      <input type="password" value={draft.confirmPassword} onChange={(event) => setDraft({ ...draft, confirmPassword: event.target.value })} required />
                    </label>
                  </div>
                </div>
              )}

              <div className="admin-form-section">
                <h4>Work Information</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Age</span>
                    <input type="number" min="0" max="120" value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value })} />
                  </label>
                  <label className="admin-field">
                    <span>Years of Experience</span>
                    <input type="number" min="0" value={draft.yearsOfExperience} onChange={(event) => setDraft({ ...draft, yearsOfExperience: event.target.value })} />
                  </label>
                  <label className="admin-field admin-field-full">
                    <span>Work Zone</span>
                    <input value={draft.workZone} onChange={(event) => setDraft({ ...draft, workZone: event.target.value })} placeholder="e.g. Zone A" />
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-primary-btn">{editingUser ? 'Save Changes' : 'Create User'}</button>
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

export { UserManagement }
