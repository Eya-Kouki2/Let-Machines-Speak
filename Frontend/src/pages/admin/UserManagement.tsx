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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setMenuOpenId(null)
    window.addEventListener('click', handleDocumentClick)
    return () => window.removeEventListener('click', handleDocumentClick)
  }, [])

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.active).length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    pending: users.filter((user) => user.role === 'ADMIN' && user.approvalStatus === 'PENDING').length,
  }), [users])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const value = `${user.name} ${user.email} ${user.role} ${user.workZone || ''}`.toLowerCase()
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
          title: 'Update role to Admin?',
          description: `${user.name} will be converted to a pending admin request until approved by a platform administrator.`,
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
      setSuccess('User status updated successfully.')
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
      setSuccess(`${user.name} approved as administrator.`)
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
      description: `This will permanently remove ${user.name} (${user.email}) from the platform. This action cannot be undone.`,
      actionLabel: 'Delete User',
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
      {/* Background ambient lighting */}
      <div className="profile-ambient-glow" aria-hidden="true" />

      {/* ── 1. Page Header ── */}
      <header className="admin-header-block">
        <div>
          <div className="admin-kicker-row">
            <span className="admin-kicker">LABES Industrial AI • Directory Control</span>
            <span className="profile-status-beacon">
              <span className="profile-status-dot" />
              Live Directory Active
            </span>
          </div>
          <h1>User &amp; Role Management</h1>

        </div>

        <div className="profile-header-actions">
          <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New User
          </button>
          <button type="button" className="profile-header-btn btn-outline" onClick={() => void loadUsers()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* ── 2. KPI Cards ── */}
      <section className="admin-kpi-grid" aria-label="User Statistics Overview">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="admin-kpi-meta">
            <span>Total Accounts</span>
            <strong>{summary.total}</strong>
            <small>Registered Personnel</small>
          </div>
        </div>

        <div className="admin-kpi-card kpi-cyan">
          <div className="admin-kpi-icon icon-cyan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          </div>
          <div className="admin-kpi-meta">
            <span>Active Users</span>
            <strong>{summary.active}</strong>
            <small>{summary.total ? `${Math.round((summary.active / summary.total) * 100)}% verified active` : '0%'}</small>
          </div>
        </div>

        <div className="admin-kpi-card kpi-orange">
          <div className="admin-kpi-icon icon-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="admin-kpi-meta">
            <span>Administrators</span>
            <strong>{summary.admins}</strong>
            <small>Tier 1 Root Access</small>
          </div>
        </div>

        <div className="admin-kpi-card kpi-warning">
          <div className="admin-kpi-icon icon-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="admin-kpi-meta">
            <span>Pending Approvals</span>
            <strong style={{ color: summary.pending > 0 ? '#fbbf24' : '#ffffff' }}>{summary.pending}</strong>
            <small>{summary.pending > 0 ? 'Requires attention' : 'All approved'}</small>
          </div>
        </div>
      </section>

      {/* ── 3. Alerts ── */}
      {error && (
        <div className="profile-alert-banner alert-error" role="alert">
          <div className="profile-alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" className="profile-alert-dismiss" onClick={() => setError('')} aria-label="Dismiss error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="profile-alert-banner alert-success" role="status">
          <div className="profile-alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
          <button type="button" className="profile-alert-dismiss" onClick={() => setSuccess('')} aria-label="Dismiss message">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── 4. Toolbar ── */}
      <section className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className="admin-input"
            placeholder="Search by name, email, role, or work zone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="admin-toolbar-filters">
          <select className="admin-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'ALL')}>
            <option value="ALL">All Roles</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>

          <select className="admin-select" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as ApprovalStatus | 'ALL')}>
            {approvalStatuses.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All Approval Status' : status}</option>)}
          </select>

          <select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {statusFilters.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'All Account Status' : status}</option>)}
          </select>

          {(query || roleFilter !== 'ALL' || approvalFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => {
                setQuery('')
                setRoleFilter('ALL')
                setApprovalFilter('ALL')
                setStatusFilter('ALL')
              }}
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* ── 5. User Directory Table Card ── */}
      <section className="admin-table-card">
        {loading ? (
          <div className="admin-empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'profileAuraSpin 2s linear infinite', color: '#34d399', marginBottom: '12px' }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            <p style={{ margin: 0 }}>Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <p style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#ecfeff' }}>No user accounts found matching the criteria.</p>
            <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
              + Add User
            </button>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Admin Approval</th>
                  <th>Work Zone</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isPendingAdmin = user.role === 'ADMIN' && user.approvalStatus === 'PENDING'
                  const initials = (user.firstName && user.lastName)
                    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                    : (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')

                  return (
                    <tr key={user.id} className={isPendingAdmin ? 'admin-pending-row' : ''}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {initials}
                          </div>
                          <div className="admin-user-copy">
                            <strong>{user.name}</strong>
                            <span>{user.role === 'ADMIN' ? 'Administrator' : 'Plant Operator'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-email-text">{user.email}</span>
                      </td>
                      <td>
                        <span className={`admin-role-badge ${user.role === 'ADMIN' ? 'admin-role-admin' : 'admin-role-user'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${badgeClassForAccountStatus(user.active)}`}>
                          <span className="profile-status-dot" style={{ width: '6px', height: '6px', backgroundColor: user.active ? '#10b981' : '#f87171' }} />
                          {user.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${badgeClassForApprovalStatus(user.approvalStatus || 'APPROVED')}`}>
                          {user.approvalStatus || 'APPROVED'}
                        </span>
                      </td>
                      <td>
                        {user.workZone ? (
                          <span className="profile-badge-pill badge-zone" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {user.workZone}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-action-menu-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="admin-menu-trigger"
                            onClick={() => setMenuOpenId((current) => current === user.id ? null : user.id)}
                            title="Actions menu"
                            aria-label="User actions"
                          >
                            •••
                          </button>
                          {menuOpenId === user.id && (
                            <div className="admin-action-menu">
                              <button type="button" onClick={() => { openEditModal(user); setMenuOpenId(null) }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Details
                              </button>

                              <button type="button" onClick={() => { void updateUser(user, { active: !user.active }); setMenuOpenId(null) }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                                  <line x1="12" y1="2" x2="12" y2="12" />
                                </svg>
                                {user.active ? 'Deactivate' : 'Activate'}
                              </button>

                              {isPendingAdmin && (
                                <>
                                  <button type="button" onClick={() => { void approveUser(user); setMenuOpenId(null) }} style={{ color: '#34d399' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Approve Admin
                                  </button>
                                  <button type="button" onClick={() => { void rejectUser(user); setMenuOpenId(null) }} style={{ color: '#f87171' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Reject Admin
                                  </button>
                                </>
                              )}

                              <button type="button" className="admin-action-danger" onClick={() => { deleteUser(user); setMenuOpenId(null) }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                </svg>
                                Delete Account
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 6. Create / Edit User Modal ── */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="admin-kicker">{editingUser ? 'Account Management' : 'New Account'}</p>
                <h3>{editingUser ? `Edit ${editingUser.name}` : 'Register New User'}</h3>
              </div>
              <button type="button" className="admin-close-btn" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={saveUser} className="admin-form-modal">
              {/* Account Credentials */}
              <div className="admin-form-section">
                <h4>Identity &amp; Role</h4>
                <div className="admin-form-grid">
                  <label className="admin-field admin-field-full">
                    <span>Full Name</span>
                    <input
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      placeholder="e.g. Elena Rostova"
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span>Email Address</span>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                      placeholder="name@company.com"
                      required
                    />
                  </label>
                  <label className="admin-field">
                    <span>Platform Role</span>
                    <select
                      value={draft.role}
                      onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
                    >
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {/* Password credentials (only for creation) */}
              {!editingUser && (
                <div className="admin-form-section">
                  <h4>Security Credentials</h4>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Password</span>
                      <div className="profile-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={draft.password}
                          onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                          placeholder="Password"
                          required
                        />
                        <button
                          type="button"
                          className="profile-password-toggle-btn"
                          onClick={() => setShowPassword((v) => !v)}
                          title={showPassword ? 'Hide' : 'Show'}
                        >
                          {showPassword ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="admin-field">
                      <span>Confirm Password</span>
                      <div className="profile-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={draft.confirmPassword}
                          onChange={(event) => setDraft({ ...draft, confirmPassword: event.target.value })}
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          className="profile-password-toggle-btn"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          title={showConfirmPassword ? 'Hide' : 'Show'}
                        >
                          {showConfirmPassword ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Plant Assignment & Demographics */}
              <div className="admin-form-section">
                <h4>Plant &amp; Demographics</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Age</span>
                    <input
                      type="number"
                      min="18"
                      max="120"
                      value={draft.age}
                      onChange={(event) => setDraft({ ...draft, age: event.target.value })}
                      placeholder="e.g. 32"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Experience (Years)</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.yearsOfExperience}
                      onChange={(event) => setDraft({ ...draft, yearsOfExperience: event.target.value })}
                      placeholder="e.g. 8"
                    />
                  </label>
                  <label className="admin-field admin-field-full">
                    <span>Assigned Work Zone</span>
                    <input
                      value={draft.workZone}
                      onChange={(event) => setDraft({ ...draft, workZone: event.target.value })}
                      placeholder="e.g. Zone A - Robotic Welding Line"
                    />
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Confirmation Dialog Modal ── */}
      {confirmAction && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="admin-confirm" onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className={`admin-kpi-icon ${confirmAction.danger ? 'admin-kpi-icon-warning' : ''}`} style={{ width: '38px', height: '38px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={confirmAction.danger ? '#f87171' : '#34d399'} strokeWidth="2.2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 style={{ margin: 0 }}>{confirmAction.title}</h3>
            </div>

            <p>{confirmAction.description}</p>

            <div className="admin-modal-actions">
              <button type="button" className="admin-secondary-btn" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`admin-primary-btn ${confirmAction.danger ? 'admin-danger-btn' : ''}`}
                onClick={() => { void confirmAction.onConfirm() }}
              >
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
