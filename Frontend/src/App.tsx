import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Login } from './pages/auth/login'
import { SignUp } from './pages/auth/signup'
import { MachineHealth } from './pages/MachineHealth'
import { UnderConstruction } from './pages/UnderConstruction'
import { SafetyMonitoringPage } from './pages/worker-safety/SafetyMonitoringPage'
import { UserManagement } from './pages/admin/UserManagement'
import { MachineManagement } from './pages/admin/MachineManagement'
import { PendingApproval } from './pages/auth/PendingApproval'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ChangePassword } from './pages/auth/ChangePassword'
import { getCurrentUser } from './services/authApi'
import { connectSocket, disconnectSocket } from './services/socket'
import type { User } from './types/admin'

const HASH_TO_TAB: Record<string, string> = {
  home:      'Home',
  dashboard: 'Dashboard',
  machines:  'Machine Health',
  'machine-health': 'Machine Health',
  safety:    'Safety',
  alerts:    'Alerts',
  profile:   'Profile',
  users: 'Users',
  'machine-management': 'Machine Management',
  'pending-approval': 'Pending Approval',
}

const protectedTabs = new Set(['Dashboard', 'Machine Health', 'Safety', 'Alerts', 'Profile'])
const adminTabs = new Set(['Users', 'Machine Management'])

function isApprovedUser(user: User | null): boolean {
  return !!user?.active && user.isApproved === true && user.approvalStatus === 'APPROVED'
}

function isApprovedAdmin(user: User | null): boolean {
  return isApprovedUser(user) && user?.role === 'ADMIN'
}

function tabFromHash(): string {
  const raw = window.location.hash.replace('#', '').toLowerCase()
  const base = raw.split('/')[0] || 'home'
  return HASH_TO_TAB[base] ?? 'Home'
}

function screenFromHash(): 'home' | 'login' | 'signup' | 'forgot' | 'change-password' {
  const hash = window.location.hash.replace('#', '').toLowerCase()
  if (hash === 'login') return 'login'
  if (hash === 'signup') return 'signup'
  if (hash === 'forgot-password' || hash === 'forgot') return 'forgot'
  if (hash === 'change-password') return 'change-password'
  return 'home'
}

function App() {
  const [screen, setScreen] = useState<'home' | 'login' | 'signup' | 'forgot' | 'change-password'>('home')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') as User | null } catch { return null }
  })
  const [activeTab, setActiveTab] = useState<string>(tabFromHash)

  const syncCurrentUserFromStorage = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null') as User | null
      setCurrentUser(storedUser)
      setIsLoggedIn(Boolean(localStorage.getItem('token')))
    } catch {
      setCurrentUser(null)
      setIsLoggedIn(false)
    }
  }

  useEffect(() => {
    const handleUserUpdated = () => syncCurrentUserFromStorage()
    window.addEventListener('user-updated', handleUserUpdated)
    return () => window.removeEventListener('user-updated', handleUserUpdated)
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user)
        setIsLoggedIn(true)
        localStorage.setItem('user', JSON.stringify(user))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setCurrentUser(null)
        setIsLoggedIn(false)
      })
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase()
      const nextScreen = screenFromHash()
      setScreen(nextScreen)

      if (nextScreen !== 'home') {
        return
      }

      if (hash === 'home' && isLoggedIn && isApprovedUser(currentUser)) {
        setActiveTab('Dashboard')
        return
      }

      setActiveTab(tabFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentUser, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setScreen('home')
      setActiveTab('Home')
      return
    }

    const hash = window.location.hash.replace('#', '').toLowerCase()
    if (!hash || hash === 'home') {
      if (isApprovedUser(currentUser)) {
        setActiveTab('Dashboard')
        try { window.location.hash = '#dashboard' } catch (e) { /* ignore */ }
      } else {
        setActiveTab('Pending Approval')
        try { window.location.hash = '#pending-approval' } catch (e) { /* ignore */ }
      }
      return
    }

    setScreen('home')
    setActiveTab(tabFromHash())
  }, [currentUser, isLoggedIn])

  const handleLoginClick = () => {
    setScreen('login')
  }

  const handleLoginSuccess = () => {
    try { setCurrentUser(JSON.parse(localStorage.getItem('user') || 'null') as User | null) } catch { setCurrentUser(null) }
    const user = JSON.parse(localStorage.getItem('user') || 'null') as User | null
    setIsLoggedIn(true)

    if (user?.mustChangePassword) {
      setScreen('change-password')
      setActiveTab('Home')
      try { window.location.hash = '#change-password' } catch (e) { /* ignore */ }
      return
    }

    setScreen('home')
    const nextTab = isApprovedUser(user) ? 'Dashboard' : 'Pending Approval'
    setActiveTab(nextTab)
    try { window.location.hash = isApprovedUser(user) ? '#dashboard' : '#pending-approval' } catch (e) { /* ignore */ }
  }

  const handleLogout = () => {
    disconnectSocket()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setCurrentUser(null)
    setScreen('home')
    setActiveTab('Home')
  }

  const handleTabChange = (tab: string) => {
    if (!isLoggedIn && (protectedTabs.has(tab) || adminTabs.has(tab))) {
      setScreen('login')
      return
    }
    if (isLoggedIn && !isApprovedUser(currentUser) && tab !== 'Home') {
      setActiveTab('Pending Approval')
      try { window.location.hash = '#pending-approval' } catch (e) { /* ignore */ }
      return
    }
    if (adminTabs.has(tab) && !isApprovedAdmin(currentUser)) {
      setActiveTab('Dashboard')
      try { window.location.hash = '#dashboard' } catch (e) { /* ignore */ }
      return
    }
    setActiveTab(tab)
  }

  if (screen === 'login') {
    return (
      <Login
        onLogin={handleLoginSuccess}
        onForgotPassword={() => setScreen('forgot')}
        onSignUp={() => setScreen('signup')}
      />
    )
  }

  if (screen === 'signup') {
    return (
      <SignUp
        onCreateAccount={handleLoginSuccess}
        onBackToLogin={() => setScreen('login')}
      />
    )
  }

  if (screen === 'forgot') {
    return (
      <ForgotPassword
        onBackToLogin={() => setScreen('login')}
      />
    )
  }

  if (screen === 'change-password') {
    return (
      <ChangePassword
        isMandatory={Boolean(currentUser?.mustChangePassword)}
        onCompleted={() => {
          void getCurrentUser().then((user) => {
            setCurrentUser(user)
            localStorage.setItem('user', JSON.stringify(user))
            setScreen('home')
            setIsLoggedIn(true)
            setActiveTab('Dashboard')
            try { window.location.hash = '#dashboard' } catch (e) { /* ignore */ }
          })
        }}
        onBackToLogin={() => setScreen('login')}
        onForgotPassword={() => setScreen('forgot')}
      />
    )
  }
  const renderPage = () => {
    switch (activeTab) {
      case 'Home':
        return <Home isLoggedIn={isLoggedIn && isApprovedUser(currentUser)} isAdmin={isApprovedAdmin(currentUser)} onSignIn={handleLoginClick} onSignUp={() => setScreen('signup')} />
      case 'Dashboard':
        if (!isLoggedIn) return <Home isLoggedIn={false} onSignIn={handleLoginClick} onSignUp={() => setScreen('signup')} />
        if (!isApprovedUser(currentUser)) return <PendingApproval user={currentUser} onLogout={handleLogout} />
        return <Dashboard onTabChange={handleTabChange} />
      case 'Pending Approval':
        return <PendingApproval user={currentUser} onLogout={handleLogout} />
      case 'Profile':
        if (!isApprovedUser(currentUser)) return <PendingApproval user={currentUser} onLogout={handleLogout} />
        return <Profile />
      case 'Machine Health':
        if (!isApprovedUser(currentUser)) return <Login onLogin={handleLoginSuccess} onSignUp={() => setScreen('signup')} />
        return <MachineHealth />
      case 'Safety':
        if (!isApprovedUser(currentUser)) return <Login onLogin={handleLoginSuccess} onSignUp={() => setScreen('signup')} />
        return <SafetyMonitoringPage />
      case 'Alerts':
        if (!isApprovedUser(currentUser)) return <Login onLogin={handleLoginSuccess} onSignUp={() => setScreen('signup')} />
        return <SafetyMonitoringPage />
      case 'Users':
        return isApprovedAdmin(currentUser) ? <UserManagement /> : <UnderConstruction pageName="Unauthorized" />
      case 'Machine Management':
        return isApprovedAdmin(currentUser) ? <MachineManagement /> : <UnderConstruction pageName="Unauthorized" />
      default:
        if (protectedTabs.has(activeTab) && !isApprovedUser(currentUser)) return <Login onLogin={handleLoginSuccess} onSignUp={() => setScreen('signup')} />
        return <UnderConstruction pageName={activeTab} />
    }
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLoginClick={handleLoginClick}
      onSignUpClick={() => setScreen('signup')}
      onLogout={handleLogout}
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
    >
      {renderPage()}
    </Layout>
  )
}

export default App
