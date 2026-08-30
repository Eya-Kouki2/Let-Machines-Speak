
interface UnderConstructionProps {
  pageName?: string
}

export function UnderConstruction({ pageName = 'Page' }: UnderConstructionProps) {
  return (
    <div className="wip-wrapper">
      <div className="wip-card">

        {/* Spinning gear icon */}
        <div className="wip-icon-ring">
          <svg className="wip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="44" height="44">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        {/* Status badge */}
        <div className="wip-badge">
          <span className="wip-badge-dot"></span>
          En cours de développement
        </div>

        {/* Page label */}
        <div className="wip-page-name">
          {pageName} — Coming Soon
        </div>

        {/* Title */}
        <h1 className="wip-title">Page Not Yet Ready</h1>

        {/* Divider */}
        <div className="wip-divider">
          <div className="wip-divider-line"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#c3d1c9" strokeWidth="1.5" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div className="wip-divider-line"></div>
        </div>

        {/* Description */}
        <p className="wip-description">
          This section is currently under active development.<br />
          Check back soon — we're building something great!
        </p>

        {/* Progress bar */}
        <div className="wip-progress-area">
          <div className="wip-progress-label">
            <span>Development Progress</span>
            <span>In Progress</span>
          </div>
          <div className="wip-progress-track">
            <div className="wip-progress-fill" style={{ '--wip-progress': '20%' } as React.CSSProperties}></div>
          </div>
        </div>

        {/* Back button */}
        <a href="#home" className="wip-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="17" height="17">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Home
        </a>

      </div>
    </div>
  )
}
