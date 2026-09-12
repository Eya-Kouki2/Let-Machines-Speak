import { apiRequest } from './apiClient'

export interface UserSettingsState {
  preferences: {
    theme: 'light' | 'dark' | 'system'
    density: 'comfortable' | 'compact'
    reducedMotion: boolean
    dashboardAnimations: boolean
    liveDashboardUpdates: boolean
  }
  notifications: {
    machineAlerts: boolean
    criticalMachineAlerts: boolean
    safetyAlerts: boolean
    emailNotifications: boolean
    inAppNotifications: boolean
    dailySummary: boolean
  }
  privacy: {
    showAccountEmail: boolean
    liveDataRefresh: boolean
  }
}

export interface PlatformSettingsState {
  singleton?: boolean
  machineThresholdDefaults: {
    vibrationRms: { warning: number; critical: number }
    peakAcceleration: { warning: number; critical: number }
    temperature: { warning: number; critical: number }
    current: { warning: number; critical: number }
    anomalyScore: { warning: number; critical: number }
  }
  registrationDefaults: {
    defaultRole: 'USER' | 'ADMIN'
    adminApprovalRequired: boolean
  }
  notificationDefaults: {
    machineAlerts: boolean
    criticalMachineAlerts: boolean
    safetyAlerts: boolean
    emailNotifications: boolean
    inAppNotifications: boolean
    dailySummary: boolean
  }
  applicationName: string
  updatedBy?: string | null
  updatedAt?: string | null
}

export function getUserSettings(): Promise<UserSettingsState> {
  return apiRequest<UserSettingsState>('/api/users/me/settings')
}

export function updateUserSettings(payload: Partial<UserSettingsState>): Promise<UserSettingsState> {
  return apiRequest<UserSettingsState>('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getPlatformSettings(): Promise<PlatformSettingsState> {
  return apiRequest<PlatformSettingsState>('/api/settings/platform')
}

export function updatePlatformSettings(payload: Partial<PlatformSettingsState>): Promise<PlatformSettingsState> {
  return apiRequest<PlatformSettingsState>('/api/settings/platform', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
