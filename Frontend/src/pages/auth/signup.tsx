import { useState } from 'react'

interface SignUpProps {
  onCreateAccount?: () => void
  onBackToLogin?: () => void
}

type SignUpFormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'Ouvrier' | 'Admin'
  age: string
  yearsOfExperience: string
  workZone: string
}

type SignUpPayload = Omit<SignUpFormState, 'age' | 'yearsOfExperience'> & {
  age: number
  yearsOfExperience: number
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

export function SignUp({ onCreateAccount, onBackToLogin }: SignUpProps) {
  const [formData, setFormData] = useState<SignUpFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Admin',
    age: '',
    yearsOfExperience: '',
    workZone: ''
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 1. Préparation du paquet de données
    const payload: SignUpPayload = {
      ...formData,
      age: Number(formData.age),
      yearsOfExperience: Number(formData.yearsOfExperience)
    }

    try {
      // 2. Envoi des données réelles vers votre API Node.js (Port 5000)
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      // 3. Gestion de la réponse du serveur
      if (response.ok) {
        alert('Inscription réussie ! Vous allez être redirigé.')

        // store returned user so navbar/profile can read it immediately
        if (data && data.user) {
          try {
            if (data.token) {
              localStorage.setItem('token', data.token)
            }
            localStorage.setItem('user', JSON.stringify(data.user))
          } catch (e) {
            // ignore storage errors
          }
        }

        // Inform app that account was created (will switch to Profile)
        onCreateAccount?.()
      } else {
        alert(data.message || "Une erreur est survenue lors de l'inscription.")
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
        <h2 style={{ margin: '0 0 8px', color: '#ecfeff', fontSize: '2rem', textAlign: 'center' }}>Sign Up</h2>
        <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#a7f3d0' }}>Create your account</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="First name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="Ouvrier">Ouvrier</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Condition : Tout ce qui se trouve ici disparaît si Admin est sélectionné */}
          {formData.role === 'Ouvrier' && (
            <>
              <div>
  <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Age</label>
  <input
    type="number"
    name="age"
    min="18" // ✅ Empêche de descendre en dessous de 18 avec les flèches
    value={formData.age}
    onChange={handleChange}
    style={inputStyle}
    placeholder="+18" // ✅ Écrit "+18" à l'intérieur de la boîte
  />
</div>


              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="3"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Work Zone</label>
                <input
                  type="text"
                  name="workZone"
                  value={formData.workZone}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Zone A"
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1fae5', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Create password"
            />
          </div>

          <button
            type="submit"
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#022c22',
              fontWeight: 800,
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 22px rgba(16, 185, 129, 0.3)',
              width: '100%'
            }}
          >
            Create Account
          </button>

          <div style={{ textAlign: 'center', marginTop: '9px' }}>
            <p style={{ margin: '0', color: '#a7f3d0', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#34d399',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
