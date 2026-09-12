import { useEffect, useMemo, useState } from 'react'
import { usersApi } from '../../services/usersApi'
import type { User, UserRole } from '../../types/admin'

const roles: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER']

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' as UserRole })

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

  const filteredUsers = useMemo(() => users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())
  ), [query, users])

  async function createUser(event: React.FormEvent) {
    event.preventDefault()
    await usersApi.create(form)
    setForm({ name: '', email: '', password: '', role: 'VIEWER' })
    await loadUsers()
  }

  async function updateUser(user: User, patch: Partial<User>) {
    await usersApi.update(user.id, patch)
    await loadUsers()
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) return
    await usersApi.remove(user.id)
    await loadUsers()
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
          <p>Admin-only user access, roles, and account status.</p>
        </div>
        <input className="admin-input" placeholder="Search users..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {error && <div className="admin-error">{error}</div>}

      <form className="admin-card admin-form" onSubmit={createUser}>
        <input className="admin-input" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="admin-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <input className="admin-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} />
        <select className="admin-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <button className="btn-go-dashboard" type="submit">Create User</button>
      </form>

      <div className="admin-card">
        {loading ? <p>Loading users...</p> : (
          <table className="admin-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
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
                  <td>{user.active ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button type="button" onClick={() => void updateUser(user, { active: !user.active })}>{user.active ? 'Disable' : 'Activate'}</button>
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
