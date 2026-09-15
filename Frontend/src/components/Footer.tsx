import { LabesLogo } from './LabesLogo'

interface FooterProps {
  onTabChange?: (tabName: string) => void
  isLoggedIn?: boolean
  onLoginClick?: () => void
  onSignUpClick?: () => void
}

export function Footer({ onTabChange, isLoggedIn = false }: FooterProps) {
  const handleNavClick = (sectionId: string, tabFallback?: string) => {
    if (isLoggedIn && tabFallback) {
      onTabChange?.(tabFallback)
      return
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.hash = `#${sectionId}`
    }
  }

  return (
    <footer className="labes-global-footer eyeconic-footer">
      <div className="eyeconic-footer-container">
        {/* Brand Logo */}
        <div className="eyeconic-footer-brand">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'Home')
            }}
            className="eyeconic-footer-logo-link"
          >
            <LabesLogo className="eyeconic-footer-logo" />
          </a>
        </div>

        {/* Tagline */}
        <p className="eyeconic-footer-tagline">
          Predictive Maintenance &bull; Industrial Safety &bull; AI-Powered
        </p>


        {/* Divider */}
        <div className="eyeconic-footer-divider" />

        {/* Copyright Line */}
        <div className="eyeconic-footer-copyright">
          &copy; {new Date().getFullYear()} <strong>LABES</strong> &mdash; Live AI-Based Equipment Safety. Built in Tunisia &trade;
        </div>
      </div>
    </footer>
  )
}
