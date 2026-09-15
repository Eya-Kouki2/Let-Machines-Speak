import React, { useState, useRef, useEffect } from 'react'
import type { User } from '../types/admin'
import { LabesLogo } from './LabesLogo'
import { getMediaUrl } from '../services/profileApi'
import { getUnreadAlertCount, getAlerts, markAllAlertsRead, type AlertRecord } from '../services/alertsApi'
import { useSocket } from '../hooks/useSocket'

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

function timeAgo(iso?: string): string {
  if (!iso) return 'Just now'
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Navbar({ mode: initialMode = 'top', onModeChange, activeTab: externalActiveTab, onTabChange, onLoginClick, onSignUpClick, onLogout, isLoggedIn = false, currentUser = null }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [recentAlerts, setRecentAlerts] = useState<AlertRecord[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState('Home')
  const [unreadAlertCount, setUnreadAlertCount] = useState(0)
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab
  const [mode, setMode] = useState<NavMode>(initialMode)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const socket = useSocket()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setDropdownOpen(false)
    setNotifOpen(false)
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

  // Load unread count & refresh when events occur
  const refreshUnread = async () => {
    try {
      const result = await getUnreadAlertCount()
      setUnreadAlertCount(result.count || 0)
    } catch {
      setUnreadAlertCount(0)
    }
  }

  // Fetch recent alerts for dropdown
  const loadRecentAlerts = async () => {
    setLoadingAlerts(true)
    try {
      const res = await getAlerts({ limit: 5 })
      setRecentAlerts(res.items || [])
    } catch {
      setRecentAlerts([])
    } finally {
      setLoadingAlerts(false)
    }
  }

  const toggleNotifDropdown = () => {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) {
      setDropdownOpen(false)
      void loadRecentAlerts()
    }
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await markAllAlertsRead()
      setUnreadAlertCount(0)
      void loadRecentAlerts()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleSeeAllAlerts = () => {
    setNotifOpen(false)
    setMobileMenuOpen(false)
    setInternalActiveTab('Alerts')
    onTabChange?.('Alerts')
    window.location.hash = '#alerts'
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadAlertCount(0)
      return
    }

    void refreshUnread()

    const handleAlertUpdate = () => {
      void refreshUnread()
      if (notifOpen) {
        void loadRecentAlerts()
      }
    }

    socket.on('alert:created', handleAlertUpdate)
    socket.on('alert:updated', handleAlertUpdate)

    return () => {
      socket.off('alert:created', handleAlertUpdate)
      socket.off('alert:updated', handleAlertUpdate)
    }
  }, [isLoggedIn, socket, notifOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Core Navigation Items (Alerts moved to dedicated bell dropdown!)
  const baseNavItems = [
    {
      name: 'Home',
      href: '#home',
      icon: null,
    },
    {
      name: 'Dashboard',
      href: '#dashboard',
      icon: null,
    },
    {
      name: 'Machine Health',
      href: '#machines',
      icon: null,
    },
    {
      name: 'Safety',
      href: '#safety',
      icon: null,
    },
  ]

  const publicNavItems = [
    {
      name: 'Home',
      href: '#home',
      icon: null,
    },
    {
      name: 'Features',
      href: '#features',
      icon: null,
    },
    {
      name: 'Contact Us',
      href: '#contact',
      icon: null,
    },
  ]

  const filteredBaseNavItems = baseNavItems.filter((item) => item.name !== 'Reports' && (!isLoggedIn || item.name !== 'Home'))
  const isApprovedAdmin = currentUser?.role === 'ADMIN' && currentUser?.isApproved && currentUser?.approvalStatus === 'APPROVED'
  const navItems = !isLoggedIn
    ? publicNavItems
    : isApprovedAdmin
    ? [
        ...filteredBaseNavItems,
        { name: 'Users', href: '#users', icon: null }
      ]
    : filteredBaseNavItems

  const savedUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
  const displayName = savedUser.name || (savedUser.firstName && savedUser.lastName
    ? `${savedUser.firstName} ${savedUser.lastName}`
    : savedUser.firstName) || 'User Name'
  const profileImageUrl = savedUser.profileImage ? getMediaUrl(savedUser.profileImage) : ''

  return (
    <header className={`navbar-fixed-wrapper mode-${mode}`}>
      <div className={`navbar-pill electric-theme ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Left: Brand Section */}
        <div className="navbar-brand-section">
          <a href="/" className="navbar-brand" aria-label="LABES home">
            <LabesLogo className="navbar-logo" />
          </a>

          {/* Mobile hamburger on mobile top row */}
          <div className="navbar-mobile-controls">
            <button
              type="button"
              className="layout-toggle-btn mobile-only-toggle"
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

        {/* Center: Navigation Items in the middle */}
        <nav className={`navbar-links ${mobileMenuOpen ? 'show-mobile' : ''}`}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`nav-link ${activeTab === item.name ? 'active' : ''}`}
              onClick={(e) => {
                if (!isLoggedIn && item.href.startsWith('#')) {
                  e.preventDefault()
                  const targetId = item.href.slice(1)
                  if (targetId === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    const el = document.getElementById(targetId)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }
                  try { window.history.replaceState(null, '', item.href) } catch (err) { /* ignore */ }
                }
                setInternalActiveTab(item.name)
                onTabChange?.(item.name === 'Features' || item.name === 'Contact Us' ? 'Home' : item.name)
                setMobileMenuOpen(false)
              }}
            >
              {item.icon && <span className="nav-link-icon">{item.icon}</span>}
              <span className="nav-link-text">{item.name}</span>
              {activeTab === item.name && <span className="soft-active-dot"></span>}
            </a>
          ))}
        </nav>

        {/* Right: Actions / Notifications / Profile Section */}
        <div className={`navbar-actions-section ${mobileMenuOpen ? 'show-mobile' : ''}`}>
          {!isLoggedIn ? (
            <div className="navbar-auth-buttons">
              <button
                type="button"
                className="nav-btn-signin"
                onClick={() => { onLoginClick?.(); setMobileMenuOpen(false) }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="nav-btn-signup"
                onClick={() => { onSignUpClick?.(); setMobileMenuOpen(false) }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="navbar-user-actions-group">
              {/* ── 🔔 Notification Bell with Live Badge & Dropdown ── */}
              <div className="nav-notif-wrapper" ref={notifRef}>
                <button
                  type="button"
                  className={`nav-notif-btn ${notifOpen ? 'open' : ''} ${unreadAlertCount > 0 ? 'has-unread' : ''}`}
                  onClick={toggleNotifDropdown}
                  aria-label="Notifications"
                  title="Notifications & Alerts"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadAlertCount > 0 && (
                    <span className="nav-notif-badge">
                      {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Menu */}
                {notifOpen && (
                  <div className="nav-notif-dropdown">
                    {/* Header */}
                    <div className="nav-notif-dropdown-header">
                      <div className="nav-notif-header-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span>Alerts</span>
                        {unreadAlertCount > 0 && (
                          <span className="nav-notif-count-pill">{unreadAlertCount} new</span>
                        )}
                      </div>
                      {unreadAlertCount > 0 && (
                        <button
                          type="button"
                          className="nav-notif-mark-read-btn"
                          onClick={handleMarkAllRead}
                          title="Mark all as read"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Alerts Content List */}
                    <div className="nav-notif-list">
                      {loadingAlerts ? (
                        <div className="nav-notif-loading">Loading alerts…</div>
                      ) : recentAlerts.length === 0 ? (
                        <div className="nav-notif-empty">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" width="22" height="22">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <p>All nominal</p>
                          <span>No unread notifications</span>
                        </div>
                      ) : (
                        recentAlerts.map((alert) => {
                          const isCrit = alert.severity === 'CRITICAL'
                          const isWarn = alert.severity === 'WARNING'
                          const isSafety = alert.category === 'SAFETY' || alert.type?.includes('SAFETY')
                          const itemClass = isCrit ? 'item-crit' : isWarn ? 'item-warn' : 'item-info'

                          return (
                            <div
                              key={alert._id}
                              className={`nav-notif-item ${itemClass}`}
                              onClick={handleSeeAllAlerts}
                            >
                              <div className="nav-notif-item-icon">
                                {isCrit ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                ) : isSafety ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                ) : isWarn ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                )}
                              </div>
                              <div className="nav-notif-item-body">
                                <div className="nav-notif-item-title-row">
                                  <span className="nav-notif-item-title">{alert.title}</span>
                                  <span className="nav-notif-item-time">{timeAgo(alert.createdAt)}</span>
                                </div>
                                <p className="nav-notif-item-msg">{alert.message}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Footer "See all" button */}
                    <div className="nav-notif-dropdown-footer">
                      <button
                        type="button"
                        className="nav-notif-see-all-btn"
                        onClick={handleSeeAllAlerts}
                      >
                        <span>See all alerts</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 👤 User Profile Dropdown ── */}
              <div className="user-profile-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className={`user-profile-pill ${dropdownOpen ? 'open' : ''}`}
                  onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar-group">
                    {profileImageUrl ? (
                      <div className="user-avatar energy-avatar">
                        <img src={profileImageUrl} alt={displayName} className="user-avatar-image" />
                      </div>
                    ) : (
                      <svg
                        className="user-human-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="20"
                        height="20"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                    <div className="user-info">
                      <span className="user-name">{displayName}</span>
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
            </div>
          )}

          {/* Mode Switch Toggle Button */}
          <button
            type="button"
            className="layout-toggle-btn desktop-only-toggle"
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
        </div>
      </div>
    </header>
  )
}
