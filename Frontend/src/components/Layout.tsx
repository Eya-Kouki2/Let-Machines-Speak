import { useState, type ReactNode } from 'react'
import { Navbar, type NavMode } from './Navbar'
import type { User } from '../types/admin'

interface LayoutProps {
  children: ReactNode
  defaultNavMode?: NavMode
  activeTab?: string
  onTabChange?: (tabName: string) => void
  onLoginClick?: () => void
  onLogout?: () => void
  isLoggedIn?: boolean
  currentUser?: User | null
}

export function Layout({ children, defaultNavMode = 'top', activeTab, onTabChange, onLoginClick, onLogout, isLoggedIn = false, currentUser = null }: LayoutProps) {
  const [navMode, setNavMode] = useState<NavMode>(defaultNavMode)

  return (
    <div className={`app-layout layout-${navMode}`}>
      <Navbar mode={navMode} onModeChange={setNavMode} activeTab={activeTab} onTabChange={onTabChange} onLoginClick={onLoginClick} onLogout={onLogout} isLoggedIn={isLoggedIn} currentUser={currentUser} />
      <main className={`main-container main-${navMode}`}>
        {children}
      </main>
      <footer className={`app-footer footer-${navMode}`}>
        <div className="footer-content">
          <p>© {new Date().getFullYear()} LABES. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
