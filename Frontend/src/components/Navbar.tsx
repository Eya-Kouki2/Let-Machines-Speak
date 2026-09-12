import { useState, useRef, useEffect } from 'react'
import type { User } from '../types/admin'
import { LabesLogo } from './LabesLogo'
import { getMediaUrl } from '../services/profileApi'

export type NavMode = 'top' | 'side'

interface NavbarProps {
  mode?: NavMode
  onModeChange?: (newMode: NavMode) => void
  activeTab?: string
  onTabChange?: (tabName: string) => void
  onLoginClick?: () => void
  onSignUpClick?: () => void
  onLogout?: () => void
  isLoggedIn?: boolean
  currentUser?: User | null
}

export function Navbar({ mode: initialMode = 'top', onModeChange, activeTab: externalActiveTab, onTabChange, onLoginClick, onSignUpClick, onLogout, isLoggedIn = false, currentUser = null }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState('Home')
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab
  const [mode, setMode] = useState<NavMode>(initialMode)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    onLogout?.()
  }

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const toggleMode = () => {
    const nextMode: NavMode = mode === 'top' ? 'side' : 'top'
    setMode(nextMode)
    onModeChange?.(nextMode)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const baseNavItems = [
    {
      name: 'Home',
      href: '#home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      name: 'Dashboard',
      href: '#dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      name: 'Machine Health',
      href: '#machines',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    },
    {
      name: 'Safety',
      href: '#safety',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      name: 'Alerts',
      href: '#alerts',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
  ]

  const filteredBaseNavItems = baseNavItems.filter((item) => item.name !== 'Reports' && (!isLoggedIn || item.name !== 'Home'))
  const isApprovedAdmin = currentUser?.role === 'ADMIN' && currentUser?.isApproved && currentUser?.approvalStatus === 'APPROVED'
  const navItems = !isLoggedIn
    ? [baseNavItems[0]]
    : isApprovedAdmin
    ? [
        ...filteredBaseNavItems,
        { name: 'Users', href: '#users', icon: baseNavItems[2].icon },
        { name: 'Machine Management', href: '#machine-management', icon: baseNavItems[2].icon },
      ]
    : filteredBaseNavItems

  const savedUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
  const displayName = savedUser.name || (savedUser.firstName && savedUser.lastName
    ? `${savedUser.firstName} ${savedUser.lastName}`
    : savedUser.firstName) || 'User Name'
  const displayRole = savedUser.role || 'Role'
  const profileImageUrl = savedUser.profileImage ? getMediaUrl(savedUser.profileImage) : ''

  return (
    <header className={`navbar-fixed-wrapper mode-${mode}`}>
      <div className={`navbar-pill electric-theme ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Top Header Section */}
        <div className="navbar-top-section">
          <a href="/" className="navbar-brand" aria-label="LABES home">
            <LabesLogo className="navbar-logo" />
          </a>

          <div className="navbar-header-actions">
            {isLoggedIn && (
              <div className={`user-profile-wrapper ${mobileMenuOpen ? 'show-mobile' : ''}`} ref={dropdownRef}>
                <button
                  type="button"
                  className={`user-profile-pill ${dropdownOpen ? 'open' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar-group">
                    <div className="user-avatar energy-avatar">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt={displayName} className="user-avatar-image" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="#052e1f" width="18" height="18">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{displayName}</span>
                      <span className="user-role">{displayRole}</span>
                    </div>
                  </div>
                  <svg
                    className={`chevron-icon ${dropdownOpen ? 'rotate' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="13"
                    height="13"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu energy-dropdown">
                    <a href="#setting" className="dropdown-item" onClick={() => { setDropdownOpen(false); setMobileMenuOpen(false) }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      Setting
                    </a>
                    <a href="#profile" className="dropdown-item" onClick={() => { setDropdownOpen(false); setMobileMenuOpen(false) }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </a>
                    <div className="dropdown-divider"></div>
                    <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode Switch Toggle Button */}
            <button
              type="button"
              className="layout-toggle-btn"
              onClick={toggleMode}
              title={`Switch to ${mode === 'top' ? 'Sidebar' : 'Top Navbar'} mode`}
            >
              {mode === 'top' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
              )}
            </button>

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`navbar-links ${mobileMenuOpen ? 'show-mobile' : ''}`}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`nav-link ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => {
                setInternalActiveTab(item.name)
                onTabChange?.(item.name)
                setMobileMenuOpen(false)
              }}
            >
              <span className="nav-link-icon">{item.icon}</span>
              <span className="nav-link-text">{item.name}</span>
              {activeTab === item.name && <span className="soft-active-dot"></span>}
            </a>
          ))}

          {!isLoggedIn && (
            <>
            <button
              type="button"
              onClick={onLoginClick}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: '#022c22',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.8rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s ease',
                marginLeft: '4px',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onSignUpClick}
              style={{
                background: 'transparent',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.8rem',
                marginLeft: '4px',
              }}
            >
              Sign Up
            </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
