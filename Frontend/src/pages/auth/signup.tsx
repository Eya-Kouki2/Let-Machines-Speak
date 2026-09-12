import { useState } from 'react'
import { signUp } from '../../services/authApi'
import { LabesLogo } from '../../components/LabesLogo'

interface SignUpProps {
  onCreateAccount?: () => void
  onBackToLogin?: () => void
}

type AccountType = 'USER' | 'ADMIN_REQUEST'

export function SignUp({ onCreateAccount, onBackToLogin }: SignUpProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'USER' as AccountType,
    age: '',
    yearsOfExperience: '',
    workZone: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        accountType: formData.accountType,
        age: formData.age ? Number(formData.age) : undefined,
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined,
        workZone: formData.workZone,
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
        <p>Standard users are approved immediately. Administrator requests are reviewed by an existing LABES admin.</p>
        <div className="auth-signal-card auth-signal-card-orange">
          <span className="auth-signal-dot" />
          Admin requests require approval
        </div>
      </section>

      <section className="auth-form-card">
        <div className="auth-form-heading">
          <h2>Create your LABES account</h2>
          <p>Use your work details to request access.</p>
        </div>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {message && <div className={`auth-alert ${formData.accountType === 'ADMIN_REQUEST' ? 'auth-alert-pending' : 'auth-alert-success'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form auth-form-grid">
          <label>
            <span>Full Name</span>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" required minLength={8} />
          </label>
          <label>
            <span>Confirm Password</span>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required minLength={8} />
          </label>
          <label>
            <span>Account Type</span>
            <select name="accountType" value={formData.accountType} onChange={handleChange}>
              <option value="USER">Standard User</option>
              <option value="ADMIN_REQUEST">Admin Request</option>
            </select>
          </label>
          <label>
            <span>Age</span>
            <input type="number" name="age" min="18" value={formData.age} onChange={handleChange} placeholder="+18" />
          </label>
          <label>
            <span>Years of Experience</span>
            <input type="number" name="yearsOfExperience" min="0" value={formData.yearsOfExperience} onChange={handleChange} placeholder="3" />
          </label>
          <label>
            <span>Work Zone</span>
            <input name="workZone" value={formData.workZone} onChange={handleChange} placeholder="e.g. Zone A" />
          </label>
          {formData.accountType === 'ADMIN_REQUEST' && <p className="auth-help">Administrator accounts require approval from an existing LABES administrator.</p>}
          <button type="submit" className="btn-go-dashboard" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>

        <p className="auth-switch">
          Already have an account? <button type="button" onClick={onBackToLogin}>Sign In</button>
        </p>
      </section>
    </div>
  )
}
