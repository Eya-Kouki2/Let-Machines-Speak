import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '../types/admin'
import { changePassword, getMediaUrl, getProfile, updateProfile, uploadAvatar } from '../services/profileApi'
import { validatePassword } from '../utils/passwordValidation'

const emptyForm = {
  firstName: '',
  lastName: '',
  age: '',
  workZone: '',
}

export function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const freshUser = await getProfile()
      setUser(freshUser)
      setForm({
        firstName: freshUser.firstName ?? '',
        lastName: freshUser.lastName ?? '',
        age: freshUser.age !== null && freshUser.age !== undefined ? String(freshUser.age) : '',
        workZone: freshUser.workZone ?? '',
      })
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.')
    }
  }

  const fullName = useMemo(() => {
    const nameParts = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    return nameParts || user?.name || 'User'
  }, [user])

  const profileImage = user?.profileImage ? getMediaUrl(user.profileImage) : ''
  const avatarSource = imagePreview || profileImage || ''

  // Live password validation checks
  const passwordRules = useMemo(() => {
    const np = passwordForm.newPassword
    return {
      length: np.length >= 8,
      upper: /[A-Z]/.test(np),
      lower: /[a-z]/.test(np),
      number: /\d/.test(np),
      special: /[^A-Za-z0-9]/.test(np),
    }
  }, [passwordForm.newPassword])

  function handleFieldChange(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSaveProfile() {
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const updatedUser = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age ? Number(form.age) : undefined,
        workZone: form.workZone.trim(),
      })

      const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
      const nextUser = { ...storedUser, ...updatedUser }
      localStorage.setItem('user', JSON.stringify(nextUser))
      setUser(updatedUser)
      window.dispatchEvent(new Event('user-updated'))
      setIsEditing(false)
      setSuccess('Profile updated successfully.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.')
      return
    }

    setError('')
    setSuccess('')
    setIsUploading(true)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)

    try {
      const result = await uploadAvatar(file)
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
      const mergedUser = { ...storedUser, ...result.user, profileImage: result.profileImage }
      localStorage.setItem('user', JSON.stringify(mergedUser))
      setUser({ ...result.user, profileImage: result.profileImage })
      window.dispatchEvent(new Event('user-updated'))
      setSuccess('Profile photo updated successfully.')
      setImagePreview(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload image.')
      setImagePreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  async function handlePasswordChange() {
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.')
      return
    }

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password are required.')
      return
    }

    const passwordValidation = validatePassword(passwordForm.newPassword)
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordFields(false)
    } catch (passwordErrorValue) {
      setPasswordError(passwordErrorValue instanceof Error ? passwordErrorValue.message : 'Unable to update password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const roleDisplay = user?.role || 'USER'
  const isUserAdmin = roleDisplay === 'ADMIN'
  const approvalDisplay = user?.approvalStatus || (user?.isApproved ? 'APPROVED' : 'PENDING')

  return (
    <div className="profile-page-shell">
      {/* Background ambient lighting */}
      <div className="profile-ambient-glow" aria-hidden="true" />

      {/* ── 1. Page Header ── */}
      <header className="profile-header-section">
        <div className="profile-header-main">
          <div className="profile-kicker-row">
            <span className="profile-kicker">LABES Industrial AI • Identity Control</span>
            <span className="profile-status-beacon">
              <span className="profile-status-dot" />
              {user?.active !== false ? 'Active & Online' : 'Inactive'}
            </span>
          </div>
          <h1 className="profile-title">User Profile &amp; Security</h1>

        </div>

        <div className="profile-header-actions">
          <a href="#settings" className="profile-header-btn btn-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Preferences
          </a>
          <button type="button" className="profile-header-btn btn-outline" onClick={() => void loadProfile()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>



      {/* ── 3. Banner Alerts ── */}
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

      {/* ── 4. Main Two-Column Master Layout ── */}
      <div className="profile-main-grid">
        {/* ── 4A. Left Column: Identity & Avatar Card ── */}
        <aside className="profile-identity-card">
          <div className="profile-avatar-superwrap">
            <div className="profile-avatar-aura-ring" aria-hidden="true" />
            <div className="profile-avatar-disc">
              {avatarSource ? (
                <img src={avatarSource} alt={fullName} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <button
              type="button"
              className="profile-avatar-upload-trigger"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new profile photo"
              disabled={isUploading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          <h2 className="profile-identity-name">{fullName}</h2>
          <p className="profile-identity-email">{user?.email || 'user@example.com'}</p>

          <div className="profile-badges-cluster">
            <span className={`profile-badge-pill ${isUserAdmin ? 'badge-admin' : 'badge-user'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {roleDisplay}
            </span>
            {user?.workZone && (
              <span className="profile-badge-pill badge-zone">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {user.workZone}
              </span>
            )}
          </div>

          <div className="profile-upload-action-box">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="profile-file-hidden"
              onChange={(event) => { void handleUpload(event.target.files?.[0] ?? null) }}
            />
            <button
              type="button"
              className="profile-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {isUploading ? 'Uploading...' : 'Change Profile Picture'}
            </button>
            <span className="profile-upload-hint">JPG, PNG, or WEBP (Max 5 MB)</span>
          </div>

          <div className="profile-metadata-table">
            <div className="profile-meta-row">
              <span className="profile-meta-row-label">Account ID</span>
              <span className="profile-meta-row-value">{user?.id ? user.id.slice(0, 10) + '...' : '—'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-row-label">Status</span>
              <span className="profile-meta-row-value val-highlight">
                {user?.active !== false ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-row-label">Approval</span>
              <span className="profile-meta-row-value">{approvalDisplay}</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-row-label">Account Age</span>
              <span className="profile-meta-row-value">{user?.age ? `${user.age} yrs` : 'Not set'}</span>
            </div>
          </div>
        </aside>

        {/* ── 4B. Right Column: Personal Details & Security ── */}
        <div className="profile-details-column">
          {/* Card 1: Personal & Operational Information */}
          <section className="profile-glass-card">
            <div className="profile-card-header">
              <div className="profile-card-title-combo">
                <div className="profile-card-icon-bubble">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="profile-card-titles">
                  <h3 className="profile-card-heading">Personal &amp; Work Details</h3>
                  <p className="profile-card-subheading">Update your identity information and plant assignment.</p>
                </div>
              </div>

              <div className="profile-card-actions">
                {!isEditing ? (
                  <button
                    type="button"
                    className="profile-btn-primary"
                    onClick={() => {
                      setIsEditing(true)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      onClick={() => {
                        setIsEditing(false)
                        setError('')
                        setSuccess('')
                        setForm({
                          firstName: user?.firstName ?? '',
                          lastName: user?.lastName ?? '',
                          age: user?.age !== null && user?.age !== undefined ? String(user.age) : '',
                          workZone: user?.workZone ?? '',
                        })
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="profile-btn-primary"
                      onClick={() => void handleSaveProfile()}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-fields-grid">
              {/* First Name */}
              <div className="profile-field-item">
                <label htmlFor="profile-first-name">First Name</label>
                {isEditing ? (
                  <div className="profile-input-wrapper">
                    <input
                      id="profile-first-name"
                      className="profile-text-input"
                      value={form.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      placeholder="e.g. Alexander"
                    />
                  </div>
                ) : (
                  <div className="profile-view-tile">
                    <span className={`profile-view-value ${!user?.firstName ? 'is-empty' : ''}`}>
                      {user?.firstName || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="profile-field-item">
                <label htmlFor="profile-last-name">Last Name</label>
                {isEditing ? (
                  <div className="profile-input-wrapper">
                    <input
                      id="profile-last-name"
                      className="profile-text-input"
                      value={form.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      placeholder="e.g. Wright"
                    />
                  </div>
                ) : (
                  <div className="profile-view-tile">
                    <span className={`profile-view-value ${!user?.lastName ? 'is-empty' : ''}`}>
                      {user?.lastName || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="profile-field-item">
                <label>
                  <span>Email Address</span>
                  <span className="profile-field-lock-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Locked
                  </span>
                </label>
                <div className="profile-view-tile">
                  <span className="profile-view-value">{user?.email || '—'}</span>
                </div>
              </div>

              {/* Role (Read-only) */}
              <div className="profile-field-item">
                <label>
                  <span>Platform Role</span>
                  <span className="profile-field-lock-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Admin Managed
                  </span>
                </label>
                <div className="profile-view-tile">
                  <span className="profile-view-value" style={{ color: isUserAdmin ? '#34d399' : '#38bdf8' }}>
                    {roleDisplay}
                  </span>
                </div>
              </div>

              {/* Age */}
              <div className="profile-field-item">
                <label htmlFor="profile-age">Age</label>
                {isEditing ? (
                  <div className="profile-input-wrapper">
                    <input
                      id="profile-age"
                      type="number"
                      min="18"
                      max="120"
                      className="profile-text-input"
                      value={form.age}
                      onChange={(e) => handleFieldChange('age', e.target.value)}
                      placeholder="e.g. 34"
                    />
                  </div>
                ) : (
                  <div className="profile-view-tile">
                    <span className={`profile-view-value ${user?.age === null || user?.age === undefined ? 'is-empty' : ''}`}>
                      {user?.age ? `${user.age} years old` : 'Not specified'}
                    </span>
                  </div>
                )}
              </div>

              {/* Work Zone */}
              <div className="profile-field-item">
                <label htmlFor="profile-workzone">Assigned Work Zone</label>
                {isEditing ? (
                  <div className="profile-input-wrapper">
                    <input
                      id="profile-workzone"
                      className="profile-text-input"
                      value={form.workZone}
                      onChange={(e) => handleFieldChange('workZone', e.target.value)}
                      placeholder="e.g. Zone A - Robotic Arm Cell"
                    />
                  </div>
                ) : (
                  <div className="profile-view-tile">
                    <span className={`profile-view-value ${!user?.workZone ? 'is-empty' : ''}`}>
                      {user?.workZone || 'Unassigned'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="profile-form-footer-actions">
                <button
                  type="button"
                  className="profile-btn-primary"
                  onClick={() => void handleSaveProfile()}
                  disabled={isSaving}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => {
                    setIsEditing(false)
                    setError('')
                    setSuccess('')
                    setForm({
                      firstName: user?.firstName ?? '',
                      lastName: user?.lastName ?? '',
                      age: user?.age !== null && user?.age !== undefined ? String(user.age) : '',
                      workZone: user?.workZone ?? '',
                    })
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

          {/* Card 2: Security & Password Management */}
          <section className="profile-glass-card">
            <div className="profile-card-header">
              <div className="profile-card-title-combo">
                <div className="profile-card-icon-bubble icon-orange">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div className="profile-card-titles">
                  <h3 className="profile-card-heading">Security &amp; Credentials</h3>
                  <p className="profile-card-subheading">Update your password and authentication protocols.</p>
                </div>
              </div>

              <button
                type="button"
                className="profile-btn-secondary"
                onClick={() => {
                  setShowPasswordFields((prev) => !prev)
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
              >
                {showPasswordFields ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Hide
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Change Password
                  </>
                )}
              </button>
            </div>

            {/* Overview Security Banner */}
            <div className="profile-security-overview-banner">
              <div className="profile-security-banner-info">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-security-shield-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div className="profile-security-banner-text">
                  <span className="profile-security-banner-title">Authentication Protected</span>
                  <span className="profile-security-banner-desc">
                    Your password is salted and encrypted using industry standard BCrypt algorithms.
                  </span>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="profile-alert-banner alert-error" role="alert" style={{ marginBottom: '16px' }}>
                <div className="profile-alert-content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{passwordError}</span>
                </div>
              </div>
            )}

            {passwordSuccess && (
              <div className="profile-alert-banner alert-success" role="status" style={{ marginBottom: '16px' }}>
                <div className="profile-alert-content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{passwordSuccess}</span>
                </div>
              </div>
            )}

            {/* Expandable Password Change Box */}
            {showPasswordFields && (
              <div className="profile-password-expandable-box">
                <div className="profile-password-inputs-grid">
                  {/* Current Password */}
                  <div className="profile-field-item">
                    <label htmlFor="profile-curr-pass">Current Password</label>
                    <div className="profile-input-wrapper">
                      <input
                        id="profile-curr-pass"
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="profile-text-input"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        className="profile-password-toggle-btn"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      >
                        {showCurrentPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="profile-field-item">
                    <label htmlFor="profile-new-pass">New Password</label>
                    <div className="profile-input-wrapper">
                      <input
                        id="profile-new-pass"
                        type={showNewPassword ? 'text' : 'password'}
                        className="profile-text-input"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="New strong password"
                      />
                      <button
                        type="button"
                        className="profile-password-toggle-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="profile-field-item">
                    <label htmlFor="profile-confirm-pass">Confirm Password</label>
                    <div className="profile-input-wrapper">
                      <input
                        id="profile-confirm-pass"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="profile-text-input"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        className="profile-password-toggle-btn"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="profile-password-checklist-card">
                  <span className="profile-checklist-title">Password Security Requirements</span>
                  <div className="profile-checklist-items">
                    <div className={`profile-check-rule ${passwordRules.length ? 'is-passed' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                        {passwordRules.length ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      <span>At least 8 characters long</span>
                    </div>

                    <div className={`profile-check-rule ${passwordRules.upper ? 'is-passed' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                        {passwordRules.upper ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>

                    <div className={`profile-check-rule ${passwordRules.lower ? 'is-passed' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                        {passwordRules.lower ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      <span>At least one lowercase letter (a-z)</span>
                    </div>

                    <div className={`profile-check-rule ${passwordRules.number ? 'is-passed' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                        {passwordRules.number ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      <span>At least one number (0-9)</span>
                    </div>

                    <div className={`profile-check-rule ${passwordRules.special ? 'is-passed' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                        {passwordRules.special ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                      </svg>
                      <span>At least one special character (!@#$%^&amp;*)</span>
                    </div>
                  </div>
                </div>

                <div className="profile-password-actions-row">
                  <button
                    type="button"
                    className="profile-btn-primary"
                    onClick={() => void handlePasswordChange()}
                    disabled={isChangingPassword}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>

                  <a href="#forgot-password" className="profile-forgot-link">
                    Forgot your password?
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
