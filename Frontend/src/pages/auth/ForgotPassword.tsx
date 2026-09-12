import { useState } from 'react'
import { forgotPassword } from '../../services/authApi'
import { LabesLogo } from '../../components/LabesLogo'

interface ForgotPasswordProps {
  onBackToLogin?: () => void
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(trimmedEmail)
      setSubmitted(true)
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : 'Unable to send password instructions.')
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
          Secure access recovery
        </div>
      </section>

      <section className="auth-form-card">
        <div className="auth-form-heading">
          <h2>{submitted ? 'Check your email' : 'Forgot your password?'}</h2>
          <p>
            {submitted
              ? 'If an account exists for that email, a temporary password has been sent.'
              : 'Enter the email associated with your LABES account. We will send you a temporary password.'}
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            <button type="submit" className="btn-go-dashboard" disabled={loading}>
              {loading ? 'Sending...' : 'Send temporary password'}
            </button>
          </form>
        ) : null}

        <p className="auth-switch">
          <button type="button" onClick={onBackToLogin}>Back to Sign In</button>
        </p>
      </section>
    </div>
  )
}
