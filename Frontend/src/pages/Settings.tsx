import { useEffect, useMemo, useState } from 'react'
import { changePassword, getMediaUrl } from '../services/profileApi'
import { getPlatformSettings, getUserSettings, updatePlatformSettings, updateUserSettings, type PlatformSettingsState, type UserSettingsState } from '../services/settingsApi'
import type { User } from '../types/admin'
import { validatePassword } from '../utils/passwordValidation'

const defaultUserSettings: UserSettingsState = {
  preferences: {
    theme: 'system',
    density: 'comfortable',
    reducedMotion: false,
    dashboardAnimations: true,
    liveDashboardUpdates: true,
  },
  notifications: {
    machineAlerts: true,
    criticalMachineAlerts: true,
    safetyAlerts: true,
    emailNotifications: true,
    inAppNotifications: true,
    dailySummary: false,
  },
  privacy: {
    showAccountEmail: true,
    liveDataRefresh: true,
  },
}

const defaultPlatformSettings: PlatformSettingsState = {
  machineThresholdDefaults: {
    vibrationRms: { warning: 4.5, critical: 7.1 },
    peakAcceleration: { warning: 2.0, critical: 4.0 },
    temperature: { warning: 70, critical: 85 },
    current: { warning: 8, critical: 10 },
    anomalyScore: { warning: 0.7, critical: 0.9 },
  },
  registrationDefaults: {
    defaultRole: 'USER',
    adminApprovalRequired: true,
  },
  notificationDefaults: {
    machineAlerts: true,
    criticalMachineAlerts: true,
    safetyAlerts: true,
    emailNotifications: true,
    inAppNotifications: true,
    dailySummary: false,
  },
  applicationName: 'LABES',
}

interface SettingsProps {
  currentUser: User | null
}

export function Settings({ currentUser }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('Account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettingsState>(defaultUserSettings)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsState>(defaultPlatformSettings)
  const [isAdmin, setIsAdmin] = useState(Boolean(currentUser?.role === 'ADMIN' && currentUser?.isApproved && currentUser?.approvalStatus === 'APPROVED'))
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  useEffect(() => {
    setIsAdmin(Boolean(currentUser?.role === 'ADMIN' && currentUser?.isApproved && currentUser?.approvalStatus === 'APPROVED'))
  }, [currentUser])

  useEffect(() => {
    const theme = userSettings.preferences.theme
    document.documentElement.setAttribute('data-theme', theme)
  }, [userSettings.preferences.theme])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const settings = await getUserSettings()
        setUserSettings({
          preferences: { ...defaultUserSettings.preferences, ...(settings.preferences || {}) },
          notifications: { ...defaultUserSettings.notifications, ...(settings.notifications || {}) },
          privacy: { ...defaultUserSettings.privacy, ...(settings.privacy || {}) },
        })

        if (isAdmin) {
          const platform = await getPlatformSettings()
          setPlatformSettings({ ...defaultPlatformSettings, ...platform })
        }
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load settings.' })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [isAdmin])

  const tabs = useMemo(() => {
    const tabsList: Array<{ name: string; icon: string }> = [
      { name: 'Account', icon: 'user' },
      { name: 'Security', icon: 'shield' },
      { name: 'Appearance', icon: 'palette' },
      { name: 'Notifications', icon: 'bell' },
      { name: 'Privacy', icon: 'lock' },
    ]
    if (isAdmin) tabsList.push({ name: 'Administration', icon: 'sliders' })
    return tabsList
  }, [isAdmin])

  const updateSetting = <K extends keyof UserSettingsState>(section: K, key: string, value: boolean | string) => {
    setUserSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [key]: value,
      },
    }))
    setMessage(null)
  }

  const updatePlatformThreshold = (metric: keyof PlatformSettingsState['machineThresholdDefaults'], bound: 'warning' | 'critical', value: number) => {
    setPlatformSettings((prev) => ({
      ...prev,
      machineThresholdDefaults: {
        ...prev.machineThresholdDefaults,
        [metric]: {
          ...prev.machineThresholdDefaults[metric],
          [bound]: value,
        },
      },
    }))
    setMessage(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateUserSettings(userSettings)
      setMessage({ type: 'success', text: 'Settings saved successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error saving settings.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAdminSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updatePlatformSettings(platformSettings)
      setMessage({ type: 'success', text: 'Platform settings saved successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error saving platform settings.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    setPasswordStatus(null)

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'Current password, new password, and confirmation are required.' })
      return
    }

    const validation = validatePassword(passwordForm.newPassword)
    if (!validation.valid) {
      setPasswordStatus({ type: 'error', text: validation.message })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New password and confirm password must match.' })
      return
    }

    setIsUpdatingPassword(true)
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordStatus({ type: 'success', text: 'Password updated successfully.' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordStatus({ type: 'error', text: error instanceof Error ? error.message : 'Unable to update password.' })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const profileImage = currentUser?.profileImage ? getMediaUrl(currentUser.profileImage) : ''
  const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.name || 'User'
  const isUserAdmin = currentUser?.role === 'ADMIN'

  // Live password validation check for security tab
  const passwordRules = useMemo(() => {
    const np = passwordForm.newPassword
    return {
      length: np.length >= 8,
      upper: /[A-Z]/.test(np),
      lower: /[a-z]/.test(np),
      number: /\d/.test(np),
      special: /[^A-Za-z0-9]/.test(np),
    }
  }, [passwordForm.newPassword])

  const renderTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'user':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      case 'shield':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )
      case 'palette':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
          </svg>
        )
      case 'bell':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        )
      case 'lock':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        )
      case 'sliders':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        )
      default:
        return null
    }
  }

  const renderSection = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'profileAuraSpin 2s linear infinite', color: '#34d399', marginBottom: '12px' }}>
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
          <p style={{ margin: 0, fontWeight: 600 }}>Loading system preferences...</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'Account':
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Account Overview</h3>
                  <p className="settings-panel-subheading">Your identity profile, plant credentials, and system association.</p>
                </div>
              </div>
              <div className="profile-card-actions">
                <button type="button" className="profile-btn-primary" onClick={() => window.location.hash = '#profile'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Profile Hero Card */}
            <div className="settings-account-hero-card">
              <div className="settings-account-hero-left">
                <div className="settings-account-avatar-disc">
                  {profileImage ? (
                    <img src={profileImage} alt={fullName} className="settings-account-avatar-img" />
                  ) : (
                    <div className="settings-account-avatar-fallback">{fullName?.[0] || 'U'}</div>
                  )}
                </div>
                <div className="settings-account-details-block">
                  <span className="settings-account-name">{fullName}</span>
                  <span className="settings-account-email">{currentUser?.email || 'user@example.com'}</span>
                  <div className="settings-account-tags-row">
                    <span className={`profile-badge-pill ${isUserAdmin ? 'badge-admin' : 'badge-user'}`}>
                      {currentUser?.role || 'USER'}
                    </span>
                    {currentUser?.workZone && (
                      <span className="profile-badge-pill badge-zone">
                        {currentUser.workZone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button type="button" className="profile-btn-secondary" onClick={() => window.location.hash = '#profile'}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Change Photo
              </button>
            </div>

            {/* Account Status Grid */}
            <div className="settings-audit-grid" style={{ marginTop: '10px' }}>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Account Status</span>
                <span className="settings-audit-value" style={{ color: currentUser?.active !== false ? '#34d399' : '#f87171' }}>
                  {currentUser?.active !== false ? 'Active & Verified' : 'Inactive'}
                </span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Admin Approval Status</span>
                <span className="settings-audit-value" style={{ color: '#38bdf8' }}>
                  {currentUser?.approvalStatus || (currentUser?.isApproved ? 'APPROVED' : 'PENDING')}
                </span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Last Activity</span>
                <span className="settings-audit-value">
                  {currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                </span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Security Tier</span>
                <span className="settings-audit-value" style={{ color: '#c084fc' }}>
                  {isUserAdmin ? 'Tier 1 • Admin Privilege' : 'Tier 2 • Plant Operator'}
                </span>
              </div>
            </div>
          </div>
        )

      case 'Security':
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble icon-orange">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Security &amp; Passwords</h3>
                  <p className="settings-panel-subheading">Update your password, view audit timestamps, and manage account protection.</p>
                </div>
              </div>
            </div>

            {/* Security Status Banner */}
            <div className="profile-security-overview-banner">
              <div className="profile-security-banner-info">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-security-shield-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div className="profile-security-banner-text">
                  <span className="profile-security-banner-title">BCrypt Encryption Active</span>
                  <span className="profile-security-banner-desc">
                    Your credentials are encrypted with salted hashes. Passwords are never stored in plaintext.
                  </span>
                </div>
              </div>
            </div>

            {passwordStatus && (
              <div
                className={`profile-alert-banner ${passwordStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}
                style={{ marginBottom: '20px' }}
              >
                <div className="profile-alert-content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
                    {passwordStatus.type === 'success' ? <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /> : <circle cx="12" cy="12" r="10" />}
                  </svg>
                  <span>{passwordStatus.text}</span>
                </div>
              </div>
            )}

            {/* Password Inputs */}
            <div className="profile-password-expandable-box" style={{ animation: 'none' }}>
              <div className="profile-password-inputs-grid">
                <div className="profile-field-item">
                  <label htmlFor="settings-curr-pass">Current Password</label>
                  <div className="profile-input-wrapper">
                    <input
                      id="settings-curr-pass"
                      type={showCurrentPass ? 'text' : 'password'}
                      className="profile-text-input"
                      placeholder="Current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="profile-password-toggle-btn"
                      onClick={() => setShowCurrentPass((v) => !v)}
                      title={showCurrentPass ? 'Hide' : 'Show'}
                    >
                      {showCurrentPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="profile-field-item">
                  <label htmlFor="settings-new-pass">New Password</label>
                  <div className="profile-input-wrapper">
                    <input
                      id="settings-new-pass"
                      type={showNewPass ? 'text' : 'password'}
                      className="profile-text-input"
                      placeholder="New password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="profile-password-toggle-btn"
                      onClick={() => setShowNewPass((v) => !v)}
                      title={showNewPass ? 'Hide' : 'Show'}
                    >
                      {showNewPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="profile-field-item">
                  <label htmlFor="settings-conf-pass">Confirm New Password</label>
                  <div className="profile-input-wrapper">
                    <input
                      id="settings-conf-pass"
                      type={showConfirmPass ? 'text' : 'password'}
                      className="profile-text-input"
                      placeholder="Confirm password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="profile-password-toggle-btn"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      title={showConfirmPass ? 'Hide' : 'Show'}
                    >
                      {showConfirmPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password checklist */}
              <div className="profile-password-checklist-card">
                <span className="profile-checklist-title">Security Rules</span>
                <div className="profile-checklist-items">
                  <div className={`profile-check-rule ${passwordRules.length ? 'is-passed' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                      {passwordRules.length ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`profile-check-rule ${passwordRules.upper ? 'is-passed' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                      {passwordRules.upper ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div className={`profile-check-rule ${passwordRules.lower ? 'is-passed' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                      {passwordRules.lower ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div className={`profile-check-rule ${passwordRules.number ? 'is-passed' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                      {passwordRules.number ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span>At least one number (0-9)</span>
                  </div>
                  <div className={`profile-check-rule ${passwordRules.special ? 'is-passed' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-rule-icon">
                      {passwordRules.special ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span>At least one special character (!@#$%^&amp;*)</span>
                  </div>
                </div>
              </div>

              <div className="profile-password-actions-row">
                <button
                  type="button"
                  className="profile-btn-primary"
                  onClick={handlePasswordSave}
                  disabled={isUpdatingPassword}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {isUpdatingPassword ? 'Saving...' : 'Update Password'}
                </button>
                <a href="#forgot-password" className="profile-forgot-link">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Audit log details */}
            <div className="settings-audit-grid">
              <div className="settings-audit-card">
                <span className="settings-audit-label">Last Password Change</span>
                <span className="settings-audit-value">
                  {currentUser?.passwordChangedAt ? new Date(currentUser.passwordChangedAt).toLocaleDateString() : 'Initial Password'}
                </span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Last Successful Login</span>
                <span className="settings-audit-value">
                  {currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : 'Active Session'}
                </span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Session Encryption</span>
                <span className="settings-audit-value" style={{ color: '#34d399' }}>JWT • TLS 1.3 Active</span>
              </div>
              <div className="settings-audit-card">
                <span className="settings-audit-label">Multi-Factor Status</span>
                <span className="settings-audit-value" style={{ color: '#94a3b8' }}>Optional</span>
              </div>
            </div>
          </div>
        )

      case 'Appearance':
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble icon-purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 000 20z" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Appearance &amp; Interface</h3>
                  <p className="settings-panel-subheading">Customize visual theme, UI density, and animations.</p>
                </div>
              </div>
              <button type="button" className="profile-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Appearance'}
              </button>
            </div>

            {/* Theme Selector */}
            <p className="settings-section-subtitle">Visual Theme</p>
            <div className="settings-options-grid">
              {[
                { key: 'dark', label: 'Dark Emerald', desc: 'Default high-contrast LABES theme', icon: 'moon' },
                { key: 'light', label: 'Light Mint', desc: 'Bright daylight industrial view', icon: 'sun' },
                { key: 'system', label: 'System Sync', desc: 'Match operating system preference', icon: 'monitor' },
              ].map((themeOpt) => {
                const isSelected = userSettings.preferences.theme === themeOpt.key
                return (
                  <div
                    key={themeOpt.key}
                    className={`settings-option-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => updateSetting('preferences', 'theme', themeOpt.key)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-option-icon">
                      {themeOpt.icon === 'moon' && <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />}
                      {themeOpt.icon === 'sun' && (
                        <>
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </>
                      )}
                      {themeOpt.icon === 'monitor' && (
                        <>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </>
                      )}
                    </svg>
                    <span className="settings-option-name">{themeOpt.label}</span>
                    <span className="settings-option-desc">{themeOpt.desc}</span>
                  </div>
                )
              })}
            </div>

            {/* Density Selector */}
            <p className="settings-section-subtitle">Layout Density</p>
            <div className="settings-options-grid grid-2">
              {[
                { key: 'comfortable', label: 'Comfortable', desc: 'Spacious padding for high readability' },
                { key: 'compact', label: 'Compact', desc: 'Higher information density for dashboards' },
              ].map((densOpt) => {
                const isSelected = userSettings.preferences.density === densOpt.key
                return (
                  <div
                    key={densOpt.key}
                    className={`settings-option-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => updateSetting('preferences', 'density', densOpt.key)}
                  >
                    <span className="settings-option-name">{densOpt.label}</span>
                    <span className="settings-option-desc">{densOpt.desc}</span>
                  </div>
                )
              })}
            </div>

            {/* Animation toggles */}
            <p className="settings-section-subtitle">Animation &amp; Motion</p>
            <div className="settings-toggle-cards-list">
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Dashboard Live Animations</span>
                  <span className="settings-toggle-desc">Enable smooth 60fps graph transitions and telemetry aura pulses.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.preferences.dashboardAnimations}
                    onChange={(e) => updateSetting('preferences', 'dashboardAnimations', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Reduced Motion Mode</span>
                  <span className="settings-toggle-desc">Disable complex parallax and ambient glows to prioritize battery and CPU.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.preferences.reducedMotion}
                    onChange={(e) => updateSetting('preferences', 'reducedMotion', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>
            </div>
          </div>
        )

      case 'Notifications':
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble icon-cyan">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Notification Channels</h3>
                  <p className="settings-panel-subheading">Control real-time edge alerts, safety violations, and email digests.</p>
                </div>
              </div>
              <button type="button" className="profile-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            <p className="settings-section-subtitle">Plant Telemetry &amp; Machine Incidents</p>
            <div className="settings-toggle-cards-list" style={{ marginBottom: '24px' }}>
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Machine Health Alerts</span>
                  <span className="settings-toggle-desc">Receive notifications when equipment vibration, temperature, or current anomalies arise.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.machineAlerts}
                    onChange={(e) => updateSetting('notifications', 'machineAlerts', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Critical Machine Shutdown Warnings</span>
                  <span className="settings-toggle-desc">High-priority edge notifications when a machine crosses critical safety boundaries.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.criticalMachineAlerts}
                    onChange={(e) => updateSetting('notifications', 'criticalMachineAlerts', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Worker Safety &amp; Zone Violations</span>
                  <span className="settings-toggle-desc">Instant alerts when safety zones or PPE non-compliance are detected via AI vision.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.safetyAlerts}
                    onChange={(e) => updateSetting('notifications', 'safetyAlerts', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>
            </div>

            <p className="settings-section-subtitle">Delivery Channels &amp; Digests</p>
            <div className="settings-toggle-cards-list">
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Email Notifications</span>
                  <span className="settings-toggle-desc">Forward high-priority alert reports directly to your registered email.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.emailNotifications}
                    onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">In-App Live Bell Alerts</span>
                  <span className="settings-toggle-desc">Display real-time banner badges in the top navigation bell dropdown.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.inAppNotifications}
                    onChange={(e) => updateSetting('notifications', 'inAppNotifications', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Daily Fleet Summary</span>
                  <span className="settings-toggle-desc">A consolidated daily operational summary of equipment uptime and safety incidents.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.notifications.dailySummary}
                    onChange={(e) => updateSetting('notifications', 'dailySummary', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>
            </div>
          </div>
        )

      case 'Privacy':
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Privacy &amp; Data Stream</h3>
                  <p className="settings-panel-subheading">Manage data exposure, profile visibility, and telemetry feeds.</p>
                </div>
              </div>
              <button type="button" className="profile-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>

            <div className="settings-toggle-cards-list" style={{ marginBottom: '24px' }}>
              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Show Account Email in Plant Directory</span>
                  <span className="settings-toggle-desc">Allow shift supervisors and colleagues to view your work email in operator lists.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.privacy.showAccountEmail}
                    onChange={(e) => updateSetting('privacy', 'showAccountEmail', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>

              <div className="settings-toggle-card">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Live Telemetry Data Refresh</span>
                  <span className="settings-toggle-desc">Maintain continuous active websocket telemetry stream while tab is in background.</span>
                </div>
                <label className="settings-switch-label">
                  <input
                    type="checkbox"
                    className="settings-switch-input"
                    checked={userSettings.privacy.liveDataRefresh}
                    onChange={(e) => updateSetting('privacy', 'liveDataRefresh', e.target.checked)}
                  />
                  <span className="settings-switch-slider" />
                </label>
              </div>
            </div>

            {/* Privacy note */}
            <div className="profile-security-overview-banner">
              <div className="profile-security-banner-info">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-security-shield-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <div className="profile-security-banner-text">
                  <span className="profile-security-banner-title">GDPR &amp; Industrial Privacy Compliant</span>
                  <span className="profile-security-banner-desc">
                    Worker vision streams are processed on local edge nodes with real-time anonymization features.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'Administration':
        if (!isAdmin) return null
        return (
          <div>
            <div className="settings-panel-header">
              <div className="settings-panel-title-group">
                <div className="settings-panel-icon-bubble icon-orange">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="settings-panel-heading">Platform Administration</h3>
                  <p className="settings-panel-subheading">Configure system-wide default thresholds, registration approval policies, and edge parameters.</p>
                </div>
              </div>
              <button type="button" className="profile-btn-primary" onClick={handleAdminSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Platform Defaults'}
              </button>
            </div>

            {/* Policy badge */}
            <div className="settings-account-hero-card" style={{ marginBottom: '24px' }}>
              <div>
                <span className="settings-toggle-title">User Registration Policy</span>
                <p className="settings-toggle-desc">Require administrator approval before newly registered users can access telemetry dashboards.</p>
              </div>
              <span className="profile-badge-pill badge-admin">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Approval Mandatory
              </span>
            </div>

            <p className="settings-section-subtitle">Default Machine Alert Thresholds</p>
            <div className="settings-threshold-cards-grid">
              {/* Vibration RMS */}
              <div className="settings-threshold-card">
                <div className="settings-threshold-card-header">
                  <span className="settings-threshold-param-name">Vibration RMS</span>
                  <span className="profile-badge-pill badge-user">mm/s</span>
                </div>
                <div className="settings-threshold-inputs-row">
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-warn">Warning</span>
                    <input
                      type="number"
                      step="0.1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.vibrationRms.warning}
                      onChange={(e) => updatePlatformThreshold('vibrationRms', 'warning', Number(e.target.value))}
                    />
                  </div>
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-crit">Critical</span>
                    <input
                      type="number"
                      step="0.1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.vibrationRms.critical}
                      onChange={(e) => updatePlatformThreshold('vibrationRms', 'critical', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Peak Acceleration */}
              <div className="settings-threshold-card">
                <div className="settings-threshold-card-header">
                  <span className="settings-threshold-param-name">Peak Acceleration</span>
                  <span className="profile-badge-pill badge-user">g</span>
                </div>
                <div className="settings-threshold-inputs-row">
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-warn">Warning</span>
                    <input
                      type="number"
                      step="0.1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.peakAcceleration.warning}
                      onChange={(e) => updatePlatformThreshold('peakAcceleration', 'warning', Number(e.target.value))}
                    />
                  </div>
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-crit">Critical</span>
                    <input
                      type="number"
                      step="0.1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.peakAcceleration.critical}
                      onChange={(e) => updatePlatformThreshold('peakAcceleration', 'critical', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Temperature */}
              <div className="settings-threshold-card">
                <div className="settings-threshold-card-header">
                  <span className="settings-threshold-param-name">Temperature</span>
                  <span className="profile-badge-pill badge-user">°C</span>
                </div>
                <div className="settings-threshold-inputs-row">
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-warn">Warning</span>
                    <input
                      type="number"
                      step="1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.temperature.warning}
                      onChange={(e) => updatePlatformThreshold('temperature', 'warning', Number(e.target.value))}
                    />
                  </div>
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-crit">Critical</span>
                    <input
                      type="number"
                      step="1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.temperature.critical}
                      onChange={(e) => updatePlatformThreshold('temperature', 'critical', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Current */}
              <div className="settings-threshold-card">
                <div className="settings-threshold-card-header">
                  <span className="settings-threshold-param-name">Current Draw</span>
                  <span className="profile-badge-pill badge-user">Amperes (A)</span>
                </div>
                <div className="settings-threshold-inputs-row">
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-warn">Warning</span>
                    <input
                      type="number"
                      step="0.5"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.current.warning}
                      onChange={(e) => updatePlatformThreshold('current', 'warning', Number(e.target.value))}
                    />
                  </div>
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-crit">Critical</span>
                    <input
                      type="number"
                      step="0.5"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.current.critical}
                      onChange={(e) => updatePlatformThreshold('current', 'critical', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Anomaly Score */}
              <div className="settings-threshold-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-threshold-card-header">
                  <span className="settings-threshold-param-name">Machine Learning Anomaly Score</span>
                  <span className="profile-badge-pill badge-zone">Probability (0.0 - 1.0)</span>
                </div>
                <div className="settings-threshold-inputs-row">
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-warn">Warning Anomaly Probability</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.anomalyScore.warning}
                      onChange={(e) => updatePlatformThreshold('anomalyScore', 'warning', Number(e.target.value))}
                    />
                  </div>
                  <div className="settings-threshold-input-box">
                    <span className="settings-threshold-input-label lbl-crit">Critical Anomaly Probability</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="settings-threshold-num-input"
                      value={platformSettings.machineThresholdDefaults.anomalyScore.critical}
                      onChange={(e) => updatePlatformThreshold('anomalyScore', 'critical', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="settings-page-shell">
      {/* Background ambient lighting */}
      <div className="profile-ambient-glow" aria-hidden="true" />

      {/* ── 1. Page Header ── */}
      <header className="settings-header-section">
        <div className="settings-header-main">
          <div className="settings-kicker-row">
            <span className="settings-kicker">LABES Industrial AI • Configuration</span>
            <span className="profile-status-beacon">
              <span className="profile-status-dot" />
              Live Sync Active
            </span>
          </div>
          <h1 className="settings-title">System &amp; User Settings</h1>

        </div>
      </header>

      {/* Global alert banner */}
      {message && (
        <div
          className={`profile-alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
          role={message.type === 'success' ? 'status' : 'alert'}
        >
          <div className="profile-alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="profile-alert-icon">
              {message.type === 'success' ? (
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
            <span>{message.text}</span>
          </div>
          <button type="button" className="profile-alert-dismiss" onClick={() => setMessage(null)} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── 2. Master-Detail Layout ── */}
      <div className="settings-layout-grid">
        {/* Left Nav Sidebar */}
        <aside className="settings-nav-sidebar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name
            return (
              <button
                key={tab.name}
                type="button"
                className={`settings-nav-button ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.name)
                  setMessage(null)
                }}
              >
                <div className="settings-nav-button-left">
                  <span className="settings-nav-icon">{renderTabIcon(tab.icon)}</span>
                  <span>{tab.name}</span>
                </div>
                {tab.name === 'Administration' && <span className="settings-nav-badge">Admin</span>}
              </button>
            )
          })}

          <div className="settings-sidebar-footer-card">
            <span className="settings-sidebar-footer-title">LABES Engine</span>
            <span className="settings-sidebar-footer-sub">v2.4.0 • Enterprise Edge System</span>
          </div>
        </aside>

        {/* Right Settings Content */}
        <div className="settings-content-panel">{renderSection()}</div>
      </div>
    </div>
  )
}
