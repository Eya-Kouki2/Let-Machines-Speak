import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { Login } from './pages/auth/login'
import { SignUp } from './pages/auth/signup'
import { MachineHealth } from './pages/MachineHealth'
import { UnderConstruction } from './pages/UnderConstruction'
import { SafetyMonitoringPage } from './pages/worker-safety/SafetyMonitoringPage'

const HASH_TO_TAB: Record<string, string> = {
  home:      'Home',
  dashboard: 'Dashboard',
  machines:  'Machine Health',
  'machine-health': 'Machine Health',
  safety:    'Safety',
  alerts:    'Alerts',
  reports:   'Reports',
  profile:   'Profile',
}

function tabFromHash(): string {
  const hash = window.location.hash.replace('#', '').toLowerCase()
  return HASH_TO_TAB[hash] ?? 'Home'
}

function App() {
  const [screen, setScreen] = useState<'home' | 'login' | 'signup' | 'forgot' | 'reset'>('home')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'))
  const [activeTab, setActiveTab] = useState<string>(tabFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setScreen('home')
      setActiveTab(tabFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Ensure default landing page is Home for anonymous visitors.
  useEffect(() => {
    if (!isLoggedIn) {
      setScreen('home')
      setActiveTab('Home')
    }
  }, [isLoggedIn])

  const handleLoginClick = () => {
    setScreen('login')
  }

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    setScreen('home')
    // ensure Home tab is selected and hash updated so navbar + routing react
    setActiveTab('Home')
    try { window.location.hash = '#home' } catch (e) { /* ignore */ }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setScreen('home')
    setActiveTab('Home')
  }

  const handleTabChange = (tab: string) => {
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

  /*if (screen === 'forgot') {
    return (
      <ForgotPassword
        onSendReset={() => setScreen('reset')}
        onBackToLogin={() => setScreen('login')}
      />
    )
  }

  if (screen === 'reset') {
    return (
      <ResetPassword
        onReset={handleLoginSuccess}
        onBackToLogin={() => setScreen('login')}
      />
    )
  }
*/
  const renderPage = () => {
    switch (activeTab) {
      case 'Home':
        return <Home />
      case 'Profile':
        return <Profile />
      case 'Machine Health':
        return <MachineHealth />
      case 'Safety':
        return <SafetyMonitoringPage />
      case 'Alerts':
        return <SafetyMonitoringPage />
      default:
        return <UnderConstruction pageName={activeTab} />
    }
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLoginClick={handleLoginClick}
      onLogout={handleLogout}
      isLoggedIn={isLoggedIn}
    >
      {renderPage()}
    </Layout>
  )
}

export default App
