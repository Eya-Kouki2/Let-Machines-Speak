import { useState } from 'react'
import { signUp } from '../../services/authApi'
import { LabesLogo } from '../../components/LabesLogo'

interface SignUpProps {
  onCreateAccount?: () => void
  onBackToLogin?: () => void
}

export function SignUp({ onCreateAccount, onBackToLogin }: SignUpProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    workZone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)

    try {
      const response = await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accountType: 'USER',
        workZone: formData.workZone || undefined,
      })

      setMessage(response.message || 'Account created successfully.')
      if (response.token && response.user) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        onCreateAccount?.()
      }
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <LabesLogo className="auth-logo" />
        <h1>Create secure LABES access</h1>
        <p>AI-powered industrial monitoring for machine health, worker safety, real-time alerts, and operational visibility.</p>
        <div className="auth-signal-card">
          <span className="auth-signal-dot" />
          Unified monitoring platform active
        </div>
      </section>

      <section className="auth-form-card">
        <div className="auth-form-heading">
          <h2>Create Account</h2>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {message && <div className="auth-alert auth-alert-success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full Name</span>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required />
          </label>
          <div className="auth-form-row">
            <label>
              <span>Password</span>
              <div className="auth-password-row">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create password" required minLength={8} />
                <button
                  type="button"
                  className="auth-password-toggle-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <label>
              <span>Confirm Password</span>
              <div className="auth-password-row">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required minLength={8} />
                <button
                  type="button"
                  className="auth-password-toggle-eye"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          </div>
          <label>
            <span>Industry Name</span>
            <input name="workZone" value={formData.workZone} onChange={handleChange} placeholder="e.g. Manufacturing, Energy, Robotics" />
          </label>
          <button type="submit" className="btn-go-dashboard" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>

        <p className="auth-switch">
          Already have an account? <button type="button" onClick={onBackToLogin}>Sign In</button>
        </p>
      </section>
    </div>
  )
}
