import type { SafetyEventRow } from "./types";
import { eventLabel, formatTime } from "./format";

interface SafetyAlertBannerProps {
  alert: SafetyEventRow;
}

export function SafetyAlertBanner({ alert }: SafetyAlertBannerProps) {
  return (
    <div className="safety-alert-banner">
      <div className="safety-alert-left">
        <span className="safety-alert-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </span>
        <div>
          <p className="safety-alert-label">Safety alert</p>
          <h2 className="safety-alert-title">{eventLabel(alert.event)} detected</h2>
          <p className="safety-alert-desc">
            A person has been detected without a safety helmet in the workplace.
          </p>
        </div>
      </div>
      <span className="safety-alert-time">{formatTime(alert.timestamp)}</span>
    </div>
  );
}