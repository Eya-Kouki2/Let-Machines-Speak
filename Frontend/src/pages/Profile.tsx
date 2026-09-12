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
      setSuccess('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.')
    }
  }

  const fullName = useMemo(() => {
    const nameParts = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    return nameParts || user?.name || 'User'
  }, [user])

  const profileImage = user?.profileImage ? getMediaUrl(user.profileImage) : ''

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
      setUser(result.user)
      setSuccess('Photo updated successfully.')
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

  const avatarSource = imagePreview || profileImage || ''

  return (
    <div className="profile-page-shell">
      <div className="profile-card">
        <div className="profile-header-row">
          <div>
            <p className="profile-kicker">Profile</p>
            <h2>Account Details</h2>
          </div>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {success && <div className="auth-alert auth-alert-success">{success}</div>}

        <div className="profile-main-layout">
          <div className="profile-avatar-column">
            <div className="profile-avatar-frame">
              {avatarSource ? (
                <img src={avatarSource} alt={fullName} className="profile-avatar-image" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="profile-avatar-icon" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="profile-file-input"
              onChange={(event) => { void handleUpload(event.target.files?.[0] ?? null) }}
            />

            <button type="button" className="btn-go-dashboard profile-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div className="profile-form-area">
            <div className="profile-grid">
              <label className="field-block">
                <span>First Name</span>
                <input
                  value={form.firstName}
                  onChange={(event) => handleFieldChange('firstName', event.target.value)}
                  disabled={!isEditing}
                  placeholder="First name"
                />
              </label>

              <label className="field-block">
                <span>Last Name</span>
                <input
                  value={form.lastName}
                  onChange={(event) => handleFieldChange('lastName', event.target.value)}
                  disabled={!isEditing}
                  placeholder="Last name"
                />
              </label>

              <label className="field-block">
                <span>Email</span>
                <input value={user?.email ?? ''} disabled readOnly />
              </label>

              <label className="field-block">
                <span>Role</span>
                <input value={user?.role ?? ''} disabled readOnly />
              </label>

              <label className="field-block">
                <span>Age</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={(event) => handleFieldChange('age', event.target.value)}
                  disabled={!isEditing}
                  placeholder="Age"
                />
              </label>

              <label className="field-block field-block-full">
                <span>Work Zone</span>
                <input
                  value={form.workZone}
                  onChange={(event) => handleFieldChange('workZone', event.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Zone A"
                />
              </label>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button type="button" className="btn-go-dashboard" onClick={() => setIsEditing(true)}>Edit Profile</button>
              ) : (
                <>
                  <button type="button" className="btn-go-dashboard" onClick={() => void handleSaveProfile()} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-safety-overview"
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
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="profile-password-section">
              <div className="profile-password-header">
                <h3>Security</h3>
                <button type="button" className="btn-safety-overview" onClick={() => setShowPasswordFields((value) => !value)}>
                  {showPasswordFields ? 'Hide' : 'Change Password'}
                </button>
              </div>

              {passwordError && <div className="auth-alert auth-alert-error">{passwordError}</div>}
              {passwordSuccess && <div className="auth-alert auth-alert-success">{passwordSuccess}</div>}

              {showPasswordFields && (
                <div className="profile-password-form">
                  <label className="field-block">
                    <span>Current Password</span>
                    <div className="auth-password-row">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                        placeholder="Current password"
                      />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowCurrentPassword((value) => !value)}>
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <label className="field-block">
                    <span>New Password</span>
                    <div className="auth-password-row">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                        placeholder="New password"
                      />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowNewPassword((value) => !value)}>
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <label className="field-block">
                    <span>Confirm New Password</span>
                    <div className="auth-password-row">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)}>
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <div className="profile-password-actions">
                    <button type="button" className="btn-go-dashboard" onClick={() => void handlePasswordChange()} disabled={isChangingPassword}>
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button type="button" className="auth-inline-link" onClick={() => {
                      window.location.hash = '#forgot-password'
                    }}>Forgot your password?</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
