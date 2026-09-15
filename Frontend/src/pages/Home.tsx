import { useState } from 'react'
import machineHealthImg from '../assets/machine_health.jpg'
import workerSafetyImg from '../assets/worker_safety.jpg'
import { Home3DShowcase } from '../components/Home3DShowcase'
import { useScrollReveal } from '../hooks/useScrollReveal'

interface HomeProps {
    isLoggedIn?: boolean
    isAdmin?: boolean
    onSignIn?: () => void
    onSignUp?: () => void
}

export function Home(_props: HomeProps) {
    useScrollReveal()
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        organization: '',
        topic: 'Machine Health Telemetry',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!contactForm.name || !contactForm.email || !contactForm.message) return
        setIsSubmitting(true)
        setTimeout(() => {
            setIsSubmitting(false)
            setIsSubmitted(true)
        }, 600)
    }

    const resetContactForm = () => {
        setContactForm({
            name: '',
            email: '',
            organization: '',
            topic: 'Machine Health Telemetry',
            message: ''
        })
        setIsSubmitted(false)
    }

    return (
        <div className="home-page-wrapper">
            {/* Ambient Moving Particles & Drawn Background Shapes (Orange & Green) */}
            <div className="home-particles-layer" aria-hidden="true">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={`o-${i}`} className={`home-orange-particle p-${i + 1}`} />
                ))}
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={`g-${i}`} className={`home-green-particle gp-${i + 1}`} />
                ))}

                {/* Drawn Background Industrial Shapes: Helmets, Vests, Machines, Workers */}
                {/* 1. Safety Helmet (Top Left) */}
                <div className="home-drawn-shape shape-helmet s-1">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 40 C12 22 22 14 32 14 C42 14 52 22 52 40 Z" />
                        <path d="M8 40 C8 39 12 38 32 38 C52 38 56 39 56 40 C56 42 50 44 32 44 C14 44 8 42 8 40 Z" />
                        <path d="M28 14 C28 18 30 26 30 38" />
                        <path d="M36 14 C36 18 34 26 34 38" />
                    </svg>
                </div>

                {/* 2. Worker with Helmet (Top Right) */}
                <div className="home-drawn-shape shape-worker s-2">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="32" cy="18" r="7" />
                        <path d="M24 16 C24 10 40 10 40 16 Z" />
                        <path d="M18 50 L18 36 C18 30 24 28 32 28 C40 28 46 30 46 36 L46 50" />
                        <path d="M30 38 L34 38 M32 36 L32 40" />
                    </svg>
                </div>

                {/* 3. Safety Vest (Mid Left) */}
                <div className="home-drawn-shape shape-vest s-3">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 12 L12 24 L16 52 L48 52 L52 24 L44 12 L36 18 L28 18 Z" />
                        <path d="M28 18 L32 30 L36 18" />
                        <line x1="32" y1="30" x2="32" y2="52" />
                        <line x1="15" y1="38" x2="49" y2="38" strokeDasharray="3 2" />
                        <line x1="16" y1="46" x2="48" y2="46" strokeDasharray="3 2" />
                    </svg>
                </div>

                {/* 4. Industrial Robotic Arm / Machine (Mid Right) */}
                <div className="home-drawn-shape shape-machine s-4">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="16" y="48" width="32" height="6" rx="2" />
                        <path d="M26 48 L26 32 L40 22 L46 26" />
                        <circle cx="26" cy="32" r="3" />
                        <circle cx="40" cy="22" r="3" />
                        <path d="M46 26 L52 20 M48 30 L54 24" />
                        <path d="M50 14 C54 18 54 26 50 30" strokeDasharray="2 2" />
                    </svg>
                </div>

                {/* 5. Industrial Machine Gear / Cog (Lower Mid Left) */}
                <div className="home-drawn-shape shape-gear s-5">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="32" cy="32" r="10" />
                        <circle cx="32" cy="32" r="4" />
                        <path d="M32 14 L32 22 M32 42 L32 50 M14 32 L22 32 M42 32 L50 32 M19 19 L25 25 M39 39 L45 45 M19 45 L25 39 M39 25 L45 19" />
                    </svg>
                </div>

                {/* 6. Safety Sensor & Telemetry Wave (Bottom Right) */}
                <div className="home-drawn-shape shape-sensor s-6">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M32 12 L48 18 C48 34 40 46 32 52 C24 46 16 34 16 18 Z" />
                        <path d="M22 32 L27 32 L30 24 L34 40 L37 32 L42 32" />
                    </svg>
                </div>

                {/* 7. Safety Helmet 2 (Bottom Left) */}
                <div className="home-drawn-shape shape-helmet s-7">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 40 C12 22 22 14 32 14 C42 14 52 22 52 40 Z" />
                        <path d="M8 40 C8 39 12 38 32 38 C52 38 56 39 56 40 C56 42 50 44 32 44 C14 44 8 42 8 40 Z" />
                        <path d="M28 14 C28 18 30 26 30 38" />
                        <path d="M36 14 C36 18 34 26 34 38" />
                    </svg>
                </div>

                {/* 8. Worker 2 (Center Low) */}
                <div className="home-drawn-shape shape-worker s-8">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="32" cy="18" r="7" />
                        <path d="M24 16 C24 10 40 10 40 16 Z" />
                        <path d="M18 50 L18 36 C18 30 24 28 32 28 C40 28 46 30 46 36 L46 50" />
                        <path d="M30 38 L34 38 M32 36 L32 40" />
                    </svg>
                </div>
            </div>

            <div className="home-content-container">

                {/* ── 1. Top Hero Section ── */}
                <div className="home-hero-card reveal" id="home">
                    {/* Left: Hero Text */}
                    <div className="hero-left reveal-left">
                        <div className="title-glow-aura"></div>

                        <h1 className="hero-main-title">
                            <span className="title-text-machines">LABES</span>
                            <span className="highlight-speak">
                                <span className="highlight-line">Live AI-Based</span>
                                <span className="highlight-line">Equipment &amp; Safety</span>
                            </span>
                        </h1>

                        <h2 className="hero-sub-title">
                            AI-powered industrial monitoring for equipment health and worker safety.
                        </h2>

                        <div className="hero-accent-bar">
                            <div className="bar-green"></div>
                            <div className="bar-orange"></div>
                        </div>

                        <p className="hero-description">
                            LABES is an AI-powered industrial monitoring platform that combines machine health monitoring and worker safety intelligence in one unified system.
                        </p>

                        <div className="hero-feature-bar">
                            <div className="hero-feature-item">
                                <div className="feature-icon-box green">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title stat-title">98%</div>
                                    <div className="feature-desc">Detection Accuracy</div>
                                </div>
                            </div>

                            <div className="hero-feature-item">
                                <div className="feature-icon-box orange">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                        <polyline points="17 6 23 6 23 12" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title stat-title">30%</div>
                                    <div className="feature-desc">Downtime Reduction</div>
                                </div>
                            </div>

                            <div className="hero-feature-item">
                                <div className="feature-icon-box blue">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title stat-title">24/7</div>
                                    <div className="feature-desc">Real-Time Monitoring</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Dual Feature Card */}
                    <div className="hero-right-card reveal-right">
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

                {/* ── 2. Why Choose Us Section (Features) ── */}
                <div className="why-choose-section reveal" id="features">
                    <div className="why-choose-card">
                        <div className="why-choose-grid">

                            {/* Left: 3D Machine + Worker Interactive Digital Twin */}
                            <div className="why-choose-left-image reveal-left">
                                <Home3DShowcase />
                            </div>

                            {/* Right: Text & Pillars */}
                            <div className="why-choose-right-text reveal-right">
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
                <div className="feature-strip-section reveal">
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

                {/* ── 4. Contact Us Section ── */}
                <div className="contact-us-section reveal" id="contact">
                    <div className="contact-us-card">
                        <div className="contact-section-header">
                            <div className="contact-badge">
                                <span className="badge-dot"></span>
                                CONTACT US
                            </div>
                            <h2 className="contact-main-title">
                                Connect with the <span className="highlight-contact">LABES Team</span>
                            </h2>
                            <p className="contact-subtitle">
                                Have questions about connecting your machinery, AI worker safety monitoring, or platform integration? Send us a message and our engineers will get back to you promptly.
                            </p>
                            <div className="contact-accent-bar">
                                <div className="bar-green"></div>
                                <div className="bar-orange"></div>
                            </div>
                        </div>

                        <div className="contact-form-wrapper">
                            {isSubmitted ? (
                                <div className="contact-success-card">
                                    <div className="success-icon-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="36" height="36">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <h3 className="success-title">Message Received!</h3>
                                    <p className="success-desc">
                                        Thank you, <strong>{contactForm.name}</strong>. A LABES specialist has received your inquiry and will contact you at <strong>{contactForm.email}</strong> shortly.
                                    </p>
                                    <button type="button" className="btn-reset-form" onClick={resetContactForm}>
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleContactSubmit}>
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label className="contact-label" htmlFor="contact-name">Full Name *</label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                required
                                                placeholder="Jane Doe"
                                                className="contact-input"
                                                value={contactForm.name}
                                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="contact-label" htmlFor="contact-email">Work Email *</label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                required
                                                placeholder="jane@company.com"
                                                className="contact-input"
                                                value={contactForm.email}
                                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label className="contact-label" htmlFor="contact-org">Organization / Plant</label>
                                            <input
                                                id="contact-org"
                                                type="text"
                                                placeholder="e.g. Apex Industrial Manufacturing"
                                                className="contact-input"
                                                value={contactForm.organization}
                                                onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="contact-label" htmlFor="contact-topic">Inquiry Area</label>
                                            <select
                                                id="contact-topic"
                                                className="contact-select"
                                                value={contactForm.topic}
                                                onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                                            >
                                                <option value="Machine Health Telemetry">Machine Health & Failure Prediction</option>
                                                <option value="Worker Safety & PPE">Worker Safety & Hazard Monitoring</option>
                                                <option value="Enterprise Integration">Enterprise Integration & Edge IoT</option>
                                                <option value="Technical Support">Technical Platform Support</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="contact-label" htmlFor="contact-message">Message *</label>
                                        <textarea
                                            id="contact-message"
                                            required
                                            rows={5}
                                            placeholder="Tell us about your machinery, factory environment, or specific monitoring requirements..."
                                            className="contact-textarea"
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        />
                                    </div>

                                    <div className="contact-form-actions">
                                        <button
                                            type="submit"
                                            className="btn-submit-contact"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-dot"></span> Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                    </svg>
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
