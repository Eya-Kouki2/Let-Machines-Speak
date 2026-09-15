import { useState, type ReactNode } from 'react'
import { Navbar, type NavMode } from './Navbar'
import { Footer } from './Footer'
import type { User } from '../types/admin'

interface LayoutProps {
  children: ReactNode
  defaultNavMode?: NavMode
  activeTab?: string
  onTabChange?: (tabName: string) => void
  onLoginClick?: () => void
  onSignUpClick?: () => void
  onLogout?: () => void
  isLoggedIn?: boolean
  currentUser?: User | null
}

export function Layout({ children, defaultNavMode = 'top', activeTab, onTabChange, onLoginClick, onSignUpClick, onLogout, isLoggedIn = false, currentUser = null }: LayoutProps) {
  const [navMode, setNavMode] = useState<NavMode>(defaultNavMode)

  return (
    <div className={`app-layout layout-${navMode}`}>
      <Navbar mode={navMode} onModeChange={setNavMode} activeTab={activeTab} onTabChange={onTabChange} onLoginClick={onLoginClick} onSignUpClick={onSignUpClick} onLogout={onLogout} isLoggedIn={isLoggedIn} currentUser={currentUser} />
      <main className={`main-container main-${navMode}`}>
        {children}
      </main>
      <Footer onTabChange={onTabChange} isLoggedIn={isLoggedIn} onLoginClick={onLoginClick} onSignUpClick={onSignUpClick} />
    </div>
  )
}
