import { useState } from 'react'
import { login } from '../../services/authApi'
import { LabesLogo } from '../../components/LabesLogo'

interface LoginProps {
  onLogin?: () => void
  onForgotPassword?: () => void
  onSignUp?: () => void
}

export function Login({ onLogin, onForgotPassword, onSignUp }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin?.()
      try { window.location.hash = '#home' } catch (e) { /* ignore */ }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.')
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
        <div className="auth-signal-card">
          <span className="auth-signal-dot" />
          Unified monitoring platform active
        </div>
      </section>

      <section className="auth-form-card">
        <div className="auth-form-heading">
          <h2>Welcome back</h2>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <div className="auth-password-row">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
              <button
                type="button"
                className="auth-password-toggle-eye"
                onClick={() => setShowPassword((value) => !value)}
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
            <button type="button" className="auth-inline-link inline-link-left" onClick={onForgotPassword}>Forgot password?</button>
          </label>
          <button type="submit" className="btn-go-dashboard" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <button type="button" onClick={onSignUp}>Create Account</button>
        </p>
      </section>
    </div>
  )
}
