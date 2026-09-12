import { useState } from 'react'
import { changePassword } from '../../services/profileApi'
import { LabesLogo } from '../../components/LabesLogo'
import { validatePassword } from '../../utils/passwordValidation'

interface ChangePasswordProps {
  isMandatory?: boolean
  onCompleted?: () => void
  onBackToLogin?: () => void
  onForgotPassword?: () => void
}

export function ChangePassword({ isMandatory = false, onCompleted, onBackToLogin, onForgotPassword }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Current password is required.')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('New password and confirm password are required.')
      return
    }

    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.')
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onCompleted?.()
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Unable to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <LabesLogo className="auth-logo" />
        <h1>Live AI-Based Equipment Safety</h1>
        <p>AI-powered industrial monitoring for machine health, worker safety, real-time alerts, and operational visibility.</p>
        <div className="auth-signal-card auth-signal-card-orange">
          <span className="auth-signal-dot" />
          {isMandatory ? 'Password update required' : 'Security update'}
        </div>
      </section>

      <section className="auth-form-card">
        <div className="auth-form-heading">
          <h2>{isMandatory ? 'Set a new password' : 'Change Password'}</h2>
          <p>
            {isMandatory
              ? 'Your account requires a new secure password before continuing.'
              : 'Update your LABES password securely.'}
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {success && <div className="auth-alert auth-alert-success">{success}</div>}

        <form onSubmit={submitPassword} className="auth-form">
          <label>
            <span>Current Password</span>
            <div className="auth-password-row">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowCurrent((value) => !value)}>
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            <span>New Password</span>
            <div className="auth-password-row">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowNew((value) => !value)}>
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            <span>Confirm New Password</span>
            <div className="auth-password-row">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm((value) => !value)}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button type="submit" className="btn-go-dashboard" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {onForgotPassword && (
          <p className="auth-switch">
            <button type="button" className="auth-inline-link" onClick={onForgotPassword}>Forgot your password?</button>
          </p>
        )}

        {onBackToLogin && (
          <p className="auth-switch">
            <button type="button" onClick={onBackToLogin}>Back to Sign In</button>
          </p>
        )}
      </section>
    </div>
  )
}
