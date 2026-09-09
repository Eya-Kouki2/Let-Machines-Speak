import { useState } from 'react'

interface LoginProps {
  onLogin?: () => void
  onForgotPassword?: () => void
  onSignUp?: () => void
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(52, 211, 153, 0.4)',
  background: 'rgba(255,255,255,0.04)',
  color: '#ecfeff',
  outline: 'none'
}

export function Login({ onLogin, onForgotPassword, onSignUp }: LoginProps) {
  // 1. États locaux pour capturer l'email et le mot de passe
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 2. Gestion de la soumission du formulaire de connexion
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      // Envoi des identifiants vers votre API backend Node.js (Port 5000)
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // 3. Stockage de la session utilisateur dans le navigateur
        localStorage.setItem('token', data.token)
        // store returned profile + the email used to login
        const userToStore = {
          firstName: data.user?.firstName || '',
          lastName: data.user?.lastName || '',
          role: data.user?.role || '',
          email
        }
        localStorage.setItem('user', JSON.stringify(userToStore))

        alert(`Bienvenue ${data.user.firstName} !`)
        
        // 4. Déclenche le changement d'affichage vers la page d'accueil/dashboard
        onLogin?.()
        try { window.location.hash = '#home' } catch (e) { /* ignore */ }
      } else {
        alert(data.message || "Email ou mot de passe incorrect.")
      }
    } catch (error) {
      console.error("Erreur de connexion au serveur:", error)
      alert("Impossible de joindre le serveur backend. Vérifiez qu'il est bien démarré.")
    }
  }

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
        maxWidth: '460px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
        padding: '30px 24px'
      }}>
        <h2 style={{ margin: '0 0 8px', color: '#ecfeff', fontSize: '2rem', textAlign: 'center' }}>Login</h2>
        <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#a7f3d0' }}>Welcome back</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          
          {/* Champ Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Lien Mot de passe oublié */}
          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#34d399',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Bouton de soumission principal */}
          <button
            type="submit"
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#022c22',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 22px rgba(16, 185, 129, 0.3)',
              marginTop: '8px'
            }}
          >
            Login
          </button>

          {/* Lien vers l'Inscription */}
            <button
            type="button"
            onClick={onSignUp}
             style={{
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#022c22',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 22px rgba(16, 185, 129, 0.3)',
              marginTop: '8px'
            }}
          >
            Sign Up
          </button>
         {/* Lien Mot de passe oublié */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              
              style={{
                background: 'transparent',
                border: 'none',
                color: '#34d399',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Don't have account?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
