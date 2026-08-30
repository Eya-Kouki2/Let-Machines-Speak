import { useState, type ReactNode } from 'react'
import { Navbar, type NavMode } from './Navbar'

interface LayoutProps {
  children: ReactNode
  defaultNavMode?: NavMode
  activeTab?: string
  onTabChange?: (tabName: string) => void
}

export function Layout({ children, defaultNavMode = 'top', activeTab, onTabChange }: LayoutProps) {
  const [navMode, setNavMode] = useState<NavMode>(defaultNavMode)

  return (
    <div className={`app-layout layout-${navMode}`}>
      <Navbar mode={navMode} onModeChange={setNavMode} activeTab={activeTab} onTabChange={onTabChange} />
      <main className={`main-container main-${navMode}`}>
        {children}
      </main>
      <footer className={`app-footer footer-${navMode}`}>
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Let Machines Speak. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
