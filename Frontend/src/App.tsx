import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { MachineHealth } from './pages/MachineHealth'
import { UnderConstruction } from './pages/UnderConstruction'

const HASH_TO_TAB: Record<string, string> = {
  home:      'Home',
  dashboard: 'Dashboard',
  machines:  'Machine Health',
  'machine-health': 'Machine Health',
  safety:    'Safety',
  alerts:    'Alerts',
  reports:   'Reports',
}

function tabFromHash(): string {
  const hash = window.location.hash.replace('#', '').toLowerCase()
  return HASH_TO_TAB[hash] ?? 'Home'
}

function App() {
  const [activeTab, setActiveTab] = useState<string>(tabFromHash)

  useEffect(() => {
    const handleHashChange = () => setActiveTab(tabFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'Home':
        return <Home />
      case 'Machine Health':
        return <MachineHealth />
      default:
        return <UnderConstruction pageName={activeTab} />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderPage()}
    </Layout>
  )
}

export default App
