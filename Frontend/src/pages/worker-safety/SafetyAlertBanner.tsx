import type { SafetyEventRow } from "./types";
import { eventLabel, formatTime } from "./format";

interface SafetyAlertBannerProps {
  alert: SafetyEventRow;
  onResolve?: (eventId: string) => void;
}

export function SafetyAlertBanner({ alert, onResolve }: SafetyAlertBannerProps) {
  const isNoHelmet = alert.event === "no_helmet";
  const isRestricted = alert.event === "restricted_zone_entry";

  const description = isNoHelmet
    ? `Worker #${alert.person_track_id} in ${alert.zone} detected without mandatory safety helmet.`
    : isRestricted
    ? `Unauthorized entry detected in restricted area ${alert.zone} via node ${alert.node_id}.`
    : `Safety compliance violation detected in ${alert.zone}.`;

  return (
    <div className="safety-alert-banner">
      <div className="safety-alert-left">
        <span className="safety-alert-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <div className="safety-alert-body">
          <div className="safety-alert-meta-top">
            <span className="safety-alert-label">CRITICAL SAFETY ALERT</span>
            <span className="safety-alert-zone-tag">{alert.zone} • {alert.node_id}</span>
          </div>
          <h2 className="safety-alert-title">{eventLabel(alert.event)} Detected</h2>
          <p className="safety-alert-desc">{description}</p>
        </div>
      </div>
      
      <div className="safety-alert-actions">
        <span className="safety-alert-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(alert.timestamp)}
        </span>
        {onResolve && alert.status === "open" && (
          <button
            type="button"
            className="safety-alert-btn-resolve"
            onClick={() => onResolve(alert.event_id)}
          >
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}