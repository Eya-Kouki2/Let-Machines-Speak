import React from 'react'

export function Profile() {
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const firstName = savedUser.firstName || ''
  const lastName = savedUser.lastName || ''
  const role = savedUser.role || ''
  const email = savedUser.email || ''
  const age = savedUser.age || ''
  const yearsOfExperience = savedUser.yearsOfExperience || ''
  const workZone = savedUser.workZone || ''

  const isWorker = role === 'Ouvrier'

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#d1fae5', fontWeight: 600 }
  const valueStyle: React.CSSProperties = { color: '#ecfeff', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(52, 211, 153, 0.08)' }

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(3, 43, 29, 0.95) 0%, rgba(6, 78, 59, 0.94) 50%, rgba(2, 32, 22, 0.96) 100%)',
        border: '1px solid rgba(52, 211, 153, 0.22)',
        borderRadius: 16,
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
        padding: 28
      }}>
        <h2 style={{ margin: 0, color: '#ecfeff', fontSize: '1.6rem' }}>Mon profil</h2>
        <p style={{ margin: '8px 0 20px', color: '#a7f3d0' }}>Détails du compte</p>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Avatar / Image placeholder */}
          <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 150,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
              border: '1px dashed rgba(167,243,208,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a7f3d0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, marginBottom: 6 }}>Avatar</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Add image</div>
              </div>
            </div>

            <button style={{
              marginTop: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#022c22',
              padding: '8px 12px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              Upload
            </button>
          </div>

          {/* Info grid */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <div style={valueStyle}>{firstName || '—'}</div>
              </div>

              <div>
                <label style={labelStyle}>Last Name</label>
                <div style={valueStyle}>{lastName || '—'}</div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <div style={valueStyle}>{email || '—'}</div>
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <div style={valueStyle}>{role || '—'}</div>
              </div>

              <div>
                <label style={labelStyle}>Age</label>
                <div style={valueStyle}>{age !== '' ? age : '—'}</div>
              </div>

              {isWorker ? (
                <div>
                  <label style={labelStyle}>Years of Experience</label>
                  <div style={valueStyle}>{yearsOfExperience !== '' ? yearsOfExperience : '—'}</div>
                </div>
              ) : (
                <div />
              )}

              {isWorker ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Work Zone</label>
                  <div style={valueStyle}>{workZone || '—'}</div>
                </div>
              ) : (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Work Zone</label>
                  <div style={valueStyle}>—</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button style={{
                border: 'none',
                borderRadius: 10,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: '#022c22',
                fontWeight: 800,
                cursor: 'pointer'
              }}>
                Edit Profile
              </button>

              <button style={{
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 10,
                padding: '10px 14px',
                background: 'transparent',
                color: '#a7f3d0',
                cursor: 'pointer'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
