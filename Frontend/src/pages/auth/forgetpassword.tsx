interface ForgotPasswordProps {
  onSendReset?: () => void
  onBackToLogin?: () => void
}

export function ForgotPassword({ onSendReset, onBackToLogin }: ForgotPasswordProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #021b13 0%, #052e1f 45%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
        padding: '30px 24px'
      }}>
        <h2 style={{ margin: '0 0 8px', color: '#ecfeff', fontSize: '2rem', textAlign: 'center' }}>Forgot Password</h2>
        <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#a7f3d0' }}>Enter your email to receive a reset link</p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Email</label>
            <input type="email" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.4)', background: 'rgba(255,255,255,0.04)', color: '#ecfeff', outline: 'none' }} placeholder="name@example.com" />
          </div>

          <button
            type="button"
            onClick={onSendReset}
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#022c22',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 22px rgba(16, 185, 129, 0.3)'
            }}
          >
            Send Reset Link
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              background: 'transparent',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              borderRadius: '10px',
              color: '#a7f3d0',
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
