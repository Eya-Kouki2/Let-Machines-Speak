import { useEffect, useMemo, useState } from 'react'
import { changePassword, getMediaUrl } from '../services/profileApi'
import { getPlatformSettings, getUserSettings, updatePlatformSettings, updateUserSettings, type PlatformSettingsState, type UserSettingsState } from '../services/settingsApi'
import type { User } from '../types/admin'

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
    const tabsList = ['Account', 'Security', 'Appearance', 'Notifications', 'Privacy']
    if (isAdmin) tabsList.push('Administration')
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

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 8 characters long.' })
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

  const renderSection = () => {
    if (loading) {
      return <div className="settings-empty-state">Loading settings...</div>
    }

    switch (activeTab) {
      case 'Account':
        return (
          <div className="settings-panel">
            <div className="settings-card-header">
              <h3>Account</h3>
            </div>
            <div className="settings-account-box">
              <div className="settings-avatar-wrap">
                {profileImage ? <img src={profileImage} alt={fullName} className="settings-avatar" /> : <div className="settings-avatar-fallback">{fullName?.[0] || 'U'}</div>}
              </div>
              <div className="settings-account-meta">
                <strong>{fullName}</strong>
                <span>{currentUser?.email}</span>
                <span>{currentUser?.role}</span>
                {currentUser?.workZone ? <span>Work Zone: {currentUser.workZone}</span> : null}
              </div>
            </div>
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={() => window.location.hash = '#profile'}>Edit Profile</button>
              <button type="button" className="labes-btn labes-btn-secondary" onClick={() => window.location.hash = '#profile'}>Change Profile Picture</button>
            </div>
          </div>
        )
      case 'Security':
        return (
          <div className="settings-panel">
            <div className="settings-card-header">
              <h3>Security</h3>
            </div>
            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Current Password</span>
                <input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
              </label>
              <label className="settings-field">
                <span>New Password</span>
                <input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
              </label>
              <label className="settings-field">
                <span>Confirm New Password</span>
                <input type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              </label>
            </div>
            {passwordStatus ? <div className={`auth-alert ${passwordStatus.type === 'success' ? 'auth-alert-success' : 'auth-alert-error'}`}>{passwordStatus.text}</div> : null}
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={handlePasswordSave} disabled={isUpdatingPassword}>{isUpdatingPassword ? 'Saving...' : 'Change Password'}</button>
              <a href="#forgot-password" className="settings-link">Forgot your password?</a>
            </div>
            <div className="settings-info-card">
              <div><span>Last password change</span><strong>{currentUser?.passwordChangedAt ? new Date(currentUser.passwordChangedAt).toLocaleDateString() : 'Not set yet'}</strong></div>
              <div><span>Last login</span><strong>{currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : 'Unavailable'}</strong></div>
              <div><span>Account status</span><strong>{currentUser?.active ? 'Active' : 'Inactive'}</strong></div>
              <div><span>Admin approval status</span><strong>{currentUser?.approvalStatus || 'N/A'}</strong></div>
            </div>
          </div>
        )
      case 'Appearance':
        return (
          <div className="settings-panel">
            <div className="settings-card-header">
              <h3>Appearance</h3>
            </div>
            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Theme</span>
                <select value={userSettings.preferences.theme} onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </label>
              <label className="settings-field">
                <span>Density</span>
                <select value={userSettings.preferences.density} onChange={(e) => updateSetting('preferences', 'density', e.target.value)}>
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label className="settings-toggle">
                <span>Dashboard animation</span>
                <input type="checkbox" checked={userSettings.preferences.dashboardAnimations} onChange={(e) => updateSetting('preferences', 'dashboardAnimations', e.target.checked)} />
              </label>
              <label className="settings-toggle">
                <span>Reduced motion</span>
                <input type="checkbox" checked={userSettings.preferences.reducedMotion} onChange={(e) => updateSetting('preferences', 'reducedMotion', e.target.checked)} />
              </label>
            </div>
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )
      case 'Notifications':
        return (
          <div className="settings-panel">
            <div className="settings-card-header"><h3>Notifications</h3></div>
            <div className="settings-toggle-list">
              {[
                ['Machine Alerts', 'machineAlerts'],
                ['Critical Machine Alerts', 'criticalMachineAlerts'],
                ['Worker Safety Alerts', 'safetyAlerts'],
                ['Email Notifications', 'emailNotifications'],
                ['In-App Notifications', 'inAppNotifications'],
                ['Daily Summary', 'dailySummary'],
              ].map(([label, key]) => (
                <label className="settings-toggle" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((userSettings.notifications as Record<string, boolean>)[key])}
                    onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )
      case 'Privacy':
        return (
          <div className="settings-panel">
            <div className="settings-card-header"><h3>Privacy</h3></div>
            <div className="settings-toggle-list">
              <label className="settings-toggle">
                <span>Show account email</span>
                <input type="checkbox" checked={userSettings.privacy.showAccountEmail} onChange={(e) => updateSetting('privacy', 'showAccountEmail', e.target.checked)} />
              </label>
              <label className="settings-toggle">
                <span>Live data refresh</span>
                <input type="checkbox" checked={userSettings.privacy.liveDataRefresh} onChange={(e) => updateSetting('privacy', 'liveDataRefresh', e.target.checked)} />
              </label>
            </div>
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )
      case 'Administration':
        if (!isAdmin) return null
        return (
          <div className="settings-panel">
            <div className="settings-card-header"><h3>Administration</h3></div>
            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Admin account approval</span>
                <input value="Required" readOnly />
              </label>
            </div>
            <div className="settings-threshold-list">
              <h4>Default machine thresholds</h4>
              <div className="settings-threshold-grid">
                {Object.entries(platformSettings.machineThresholdDefaults).map(([key, value]) => (
                  <div key={key} className="settings-threshold-box">
                    <strong>{key}</strong>
                    <span>Warning: {value.warning}</span>
                    <span>Critical: {value.critical}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-actions-row">
              <button type="button" className="labes-btn labes-btn-primary" onClick={handleAdminSave} disabled={saving}>{saving ? 'Saving...' : 'Save Platform Defaults'}</button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="settings-page-shell">
      <div className="settings-page-header">
        <div>
          <p className="settings-kicker">Settings</p>
          <h2>Manage your account, preferences, security and application behavior.</h2>
        </div>
      </div>

      {message ? <div className={`auth-alert ${message.type === 'success' ? 'auth-alert-success' : 'auth-alert-error'}`}>{message.text}</div> : null}

      <div className="settings-layout">
        <aside className="settings-nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`settings-nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </aside>
        <div className="settings-content">{renderSection()}</div>
      </div>
    </div>
  )
}
