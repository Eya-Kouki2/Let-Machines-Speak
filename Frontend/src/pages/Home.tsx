import machineHealthImg from '../assets/machine_health.jpg'
import workerSafetyImg from '../assets/worker_safety.jpg'
import whyChooseUsImg from '../assets/why_choose_us.jpg'

export function Home() {
    return (
        <div className="home-page-wrapper">
            <div className="home-content-container">

                {/* ── 1. Top Hero Section ── */}
                <div className="home-hero-card">
                    {/* Left: Hero Text */}
                    <div className="hero-left">
                        <div className="title-glow-aura"></div>

                        <h1 className="hero-main-title">
                            <span className="title-text-machines">LABES</span>
                            <span className="highlight-speak">Live AI-Based Equipment Safety</span>
                        </h1>

                        <h2 className="hero-sub-title">
                            AI-powered industrial monitoring for machines and workers.
                        </h2>

                        <div className="hero-accent-bar">
                            <div className="bar-green"></div>
                            <div className="bar-orange"></div>
                        </div>

                        <p className="hero-description">
                            LABES combines machine health monitoring and worker safety intelligence in one unified system.
                        </p>

                        <div className="hero-buttons">
                            <a href="#dashboard" className="btn-go-dashboard">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="17" height="17">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                Go to Dashboard
                            </a>

                            <a href="#safety" className="btn-safety-overview">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="17" height="17">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                Safety Overview
                            </a>
                        </div>
                    </div>

                    {/* Right: Dual Feature Card */}
                    <div className="hero-right-card">
                        {/* Green side — Machine Health */}
                        <div className="card-side-green">
                            <img src={machineHealthImg} alt="Machine Health" className="bg-image" />

                            <div className="side-header">
                                <div className="pulse-icon-wrapper">
                                    <svg className="pulse-icon-svg" viewBox="0 0 32 32" fill="none"
                                        stroke="currentColor" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 16h5l3-9 5 18 4-12 3 3h4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="side-body">
                                <h3 className="side-title">Machine Health</h3>
                                <p className="side-desc">Monitor performance and predict failures early.</p>
                            </div>
                        </div>

                        {/* Orange side — Worker Safety */}
                        <div className="card-side-orange">
                            <img src={workerSafetyImg} alt="Worker Safety" className="bg-image" />

                            <div className="side-header">
                                <div className="shield-badge-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="24" height="24">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                                        <path d="M12 14c-2.67 0-4 1.34-4 2v1h8v-1c0-.66-1.33-2-4-2z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="side-body">
                                <h3 className="side-title">Worker Safety</h3>
                                <p className="side-desc">Detect risks and ensure a safe working environment.</p>
                            </div>
                        </div>

                        {/* Center badge on the split */}
                        <div className="center-split-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                                <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                <path d="M8 3.13a4 4 0 0 1 0 7.75" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── 2. Why Choose Us Section ── */}
                <div className="why-choose-section">
                    <div className="why-choose-card">
                        <div className="why-choose-grid">

                            {/* Left: Showcase Image Card */}
                            <div className="why-choose-left-image">
                                <div className="image-frame-wrapper">
                                    <img src={whyChooseUsImg} alt="Why Choose Us Showcase" className="showcase-img" />
                                    <div className="glass-overlay-badge">
                                        <span className="badge-live-pulse"></span>
                                        Real-time Telemetry Stream
                                    </div>
                                </div>
                            </div>

                            {/* Right: Text & Pillars */}
                            <div className="why-choose-right-text">
                                <div className="why-choose-badge">
                                    <span className="badge-dot"></span>
                                    WHY CHOOSE US
                                </div>

                                <h2 className="why-choose-title">
                                    <span className="title-text-onesystem">One system.</span>
                                    <span className="title-text-protections">Two critical protections.</span>
                                </h2>

                                <p className="why-choose-desc">
                                    We bring together predictive machine monitoring and worker safety in one reliable system...
                                </p>

                                <div className="why-accent-bar">
                                    <div className="bar-green"></div>
                                    <div className="bar-orange"></div>
                                </div>

                                {/* Pillars / Timeline */}
                                <div className="why-choose-timeline">
                                    <div className="pillars-row">
                                        <div className="pillar-item">
                                            <div className="pillar-icon-box green">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                                    <circle cx="12" cy="12" r="3" />
                                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                </svg>
                                            </div>
                                            <div className="pillar-text">
                                                <span className="pillar-title">Machine<br />Reliability</span>
                                                <span className="pillar-sub">Predict failures early.</span>
                                            </div>
                                        </div>

                                        <div className="pillar-divider"></div>

                                        <div className="pillar-item">
                                            <div className="pillar-icon-box orange">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                </svg>
                                            </div>
                                            <div className="pillar-text">
                                                <span className="pillar-title">Worker<br />Safety</span>
                                                <span className="pillar-sub">Detect risks and keep<br />people protected.</span>
                                            </div>
                                        </div>

                                        <div className="pillar-divider"></div>

                                        <div className="pillar-item">
                                            <div className="pillar-icon-box target">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="6" />
                                                    <circle cx="12" cy="12" r="2" />
                                                </svg>
                                            </div>
                                            <div className="pillar-text">
                                                <span className="pillar-title">One<br />Dashboard</span>
                                                <span className="pillar-sub">Everything in one place.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── 3. Feature Highlights Strip ── */}
                <div className="feature-strip-section">
                  <div className="feature-strip-inner">

                    <div className="feature-strip-item">
                      <div className="feature-strip-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      </div>
                      <div className="feature-strip-text">
                        <span className="feature-strip-title">Early Detection</span>
                        <span className="feature-strip-desc">Catch issues before they become failures.</span>
                      </div>
                    </div>

                    <div className="feature-strip-divider" />

                    <div className="feature-strip-item">
                      <div className="feature-strip-icon orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </div>
                      <div className="feature-strip-text">
                        <span className="feature-strip-title">Real-time Alerts</span>
                        <span className="feature-strip-desc">Instant notifications that keep you ahead.</span>
                      </div>
                    </div>

                    <div className="feature-strip-divider" />

                    <div className="feature-strip-item">
                      <div className="feature-strip-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </div>
                      <div className="feature-strip-text">
                        <span className="feature-strip-title">Data-driven Decisions</span>
                        <span className="feature-strip-desc">Smarter decisions with accurate industrial data.</span>
                      </div>
                    </div>

                    <div className="feature-strip-divider" />

                    <div className="feature-strip-item">
                      <div className="feature-strip-icon amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                          <line x1="12" y1="12" x2="12" y2="16" />
                          <line x1="10" y1="14" x2="14" y2="14" />
                        </svg>
                      </div>
                      <div className="feature-strip-text">
                        <span className="feature-strip-title">Built for Industry</span>
                        <span className="feature-strip-desc">Reliable, scalable and made for your world.</span>
                      </div>
                    </div>

                  </div>
                </div>

            </div>
        </div>
    )
}
