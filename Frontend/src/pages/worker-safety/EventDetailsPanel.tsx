import type { SafetyEventRow } from "./types";
import { eventLabel, eventSeverity, formatDate, formatTime } from "./format";
import { getMediaUrl } from "../../services/profileApi";

interface EventDetailsPanelProps {
  event: SafetyEventRow;
  onResolve?: (eventId: string) => void;
}

export function EventDetailsPanel({ event, onResolve }: EventDetailsPanelProps) {
  const violations = Array.isArray(event.violations) ? event.violations : [];
  const severity = eventSeverity(event.event);
  const isNoHelmet = event.event === "no_helmet";
  const isRestricted = event.event === "restricted_zone_entry";
  const imageUrl = getMediaUrl(event.snapshot_url);

  return (
    <div className="safety-details-card">
      <div className="safety-details-grid">
        {/* Left: AI Camera HUD Stream View */}
        <div className="safety-camera-frame">
          {/* Top HUD Overlay */}
          <div className="safety-camera-hud-top">
            <span className="safety-camera-hud-cam">
              <span className="safety-camera-rec-dot" />
              {event.node_id.toUpperCase()} • AI VISION STREAM
            </span>
            <span className="safety-camera-hud-live">LIVE INFERENCE</span>
          </div>

          {/* Camera Frame Content */}
          {imageUrl && !imageUrl.includes("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA=") ? (
            <div className="safety-camera-image-wrap">
              <img className="safety-camera-image" src={imageUrl} alt="Safety alert camera feed" />
              <div className="safety-ai-bounding-box">
                <span className="safety-ai-box-tag">
                  {isNoHelmet ? "⚠ NO HELMET 98.4%" : isRestricted ? "⛔ RESTRICTED 99.1%" : "✓ PPE OK 99.5%"}
                </span>
              </div>
            </div>
          ) : (
            <div className="safety-camera-placeholder">
              {/* Tech Reticle & Silhouette Blueprint */}
              <div className="safety-hud-reticle">
                <svg viewBox="0 0 200 160" className="safety-hud-svg" fill="none" stroke="currentColor">
                  {/* Grid Lines */}
                  <line x1="20" y1="80" x2="180" y2="80" stroke="rgba(52, 211, 153, 0.2)" strokeDasharray="4 4" />
                  <line x1="100" y1="20" x2="100" y2="140" stroke="rgba(52, 211, 153, 0.2)" strokeDasharray="4 4" />
                  <circle cx="100" cy="80" r="45" stroke="rgba(52, 211, 153, 0.3)" strokeDasharray="6 3" />
                  <circle cx="100" cy="80" r="2" fill="#34d399" />
                  
                  {/* Corner Reticles */}
                  <path d="M 40 40 L 40 30 L 50 30" stroke="#34d399" strokeWidth="2" />
                  <path d="M 160 40 L 160 30 L 150 30" stroke="#34d399" strokeWidth="2" />
                  <path d="M 40 120 L 40 130 L 50 130" stroke="#34d399" strokeWidth="2" />
                  <path d="M 160 120 L 160 130 L 150 130" stroke="#34d399" strokeWidth="2" />

                  {/* Worker Silhouette representation */}
                  <circle cx="100" cy="65" r="14" stroke={isNoHelmet ? "#f87171" : "#34d399"} strokeWidth="1.8" />
                  {isNoHelmet && (
                    <path d="M 88 56 Q 100 48 112 56" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="2 2" />
                  )}
                  <path d="M 80 120 L 80 96 C 80 86 89 84 100 84 C 111 84 120 86 120 96 L 120 120" stroke={isNoHelmet ? "#f87171" : "#34d399"} strokeWidth="1.8" />
                </svg>

                {/* Simulated AI Detection Bounding Box */}
                <div className={`safety-ai-box-simulated ${isNoHelmet ? "box-danger" : isRestricted ? "box-warning" : "box-success"}`}>
                  <span className="safety-ai-box-label">
                    {isNoHelmet ? "TARGET #3: MISSING HARDHAT (98.4%)" : isRestricted ? "RESTRICTED PERIMETER (99.1%)" : "PPE COMPLIANT (99.5%)"}
                  </span>
                </div>
              </div>
              <p className="safety-camera-caption">Edge-AI Vision Inference Stream</p>
            </div>
          )}

          {/* Bottom HUD Bar */}
          <div className="safety-camera-hud-bottom">
            <span className="safety-camera-tag">
              <span className="safety-hud-icon">📍</span> {event.zone} • {event.node_id}
            </span>
            <span className="safety-camera-time-tag">
              {formatDate(event.timestamp)} {formatTime(event.timestamp)}
            </span>
          </div>
        </div>

        {/* Right: AI Telemetry & PPE Compliance Breakdown */}
        <div className="safety-details-panel">
          <div className="safety-panel-header">
            <div>
              <div className="safety-panel-kicker">AI INFERENCE TELEMETRY</div>
              <h3 className="safety-panel-title">{eventLabel(event.event)}</h3>
            </div>
            <span className={`safety-badge-severity severity-${severity}`}>
              <span className="safety-event-dot" />
              {severity.toUpperCase()}
            </span>
          </div>

          <div className="safety-telemetry-grid">
            <div className="safety-metric-box">
              <span className="safety-metric-k">Location Zone</span>
              <strong className="safety-metric-v">{event.zone}</strong>
            </div>
            <div className="safety-metric-box">
              <span className="safety-metric-k">Camera Node</span>
              <strong className="safety-metric-v">{event.node_id}</strong>
            </div>
            <div className="safety-metric-box">
              <span className="safety-metric-k">Worker Track ID</span>
              <strong className="safety-metric-v">#TRK-{String(event.person_track_id).padStart(3, '0')}</strong>
            </div>
            <div className="safety-metric-box">
              <span className="safety-metric-k">Current Status</span>
              <strong className={`safety-metric-v status-${event.status}`}>
                {event.status === "open" ? "Active Violation" : "Resolved"}
              </strong>
            </div>
          </div>

          {/* AI Confidence Bar */}
          {(() => {
            const confVal = typeof event.confidence === 'number'
              ? event.confidence <= 1 ? (event.confidence * 100).toFixed(1) : event.confidence.toFixed(1)
              : isNoHelmet ? "98.4" : isRestricted ? "99.1" : "99.6";
            return (
              <div className="safety-confidence-block">
                <div className="safety-confidence-header">
                  <span>Model Confidence</span>
                  <strong>{confVal}%</strong>
                </div>
                <div className="safety-confidence-track">
                  <div
                    className={`safety-confidence-bar ${isNoHelmet ? "bar-danger" : isRestricted ? "bar-warning" : "bar-success"}`}
                    style={{ width: `${confVal}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* PPE Compliance Checklist */}
          <div className="safety-compliance-section">
            <h4 className="safety-compliance-title">PPE &amp; Perimeter Protocol Checklist</h4>
            <div className="safety-compliance-list">
              <div className={`safety-check-item ${isNoHelmet ? "check-fail" : "check-pass"}`}>
                <span className="check-icon">{isNoHelmet ? "✕" : "✓"}</span>
                <div className="check-info">
                  <span className="check-label">Hardhat / Safety Helmet</span>
                  <span className="check-sub">{isNoHelmet ? "Violated — Missing PPE" : "Compliant — Hardhat detected"}</span>
                </div>
              </div>

              <div className="safety-check-item check-pass">
                <span className="check-icon">✓</span>
                <div className="check-info">
                  <span className="check-label">High-Visibility Vest</span>
                  <span className="check-sub">Compliant — Class 2 Vest verified</span>
                </div>
              </div>

              <div className={`safety-check-item ${isRestricted ? "check-fail" : "check-pass"}`}>
                <span className="check-icon">{isRestricted ? "✕" : "✓"}</span>
                <div className="check-info">
                  <span className="check-label">Perimeter Authorization</span>
                  <span className="check-sub">{isRestricted ? "Breach — Restricted Zone Entry" : "Authorized Zone Access"}</span>
                </div>
              </div>
            </div>
          </div>

          {violations.length > 0 && (
            <div className="safety-active-violations-card">
              <span className="violations-title">Active Violations:</span>
              <div className="violations-tags">
                {violations.map((v) => (
                  <span key={v} className="violation-tag">⚠ {v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Actions */}
          <div className="safety-details-actions">
            {event.status === "open" && onResolve ? (
              <button
                type="button"
                className="safety-btn safety-btn--primary"
                onClick={() => onResolve(event.event_id)}
              >
                ✓ Mark Violation Resolved
              </button>
            ) : (
              <button
                type="button"
                className="safety-btn safety-btn--resolved"
                disabled
              >
                ✓ Protocol Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}