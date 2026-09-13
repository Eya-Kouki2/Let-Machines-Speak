import type { SafetyEventRow } from "./types";
import { eventLabel, formatDate, formatTime } from "./format";

interface EventDetailsPanelProps {
  event: SafetyEventRow;
}

export function EventDetailsPanel({ event }: EventDetailsPanelProps) {
  const violations = Array.isArray(event.violations) ? event.violations : [];

  return (
    <div className="safety-details-grid">
      <div className="safety-camera-frame">
        {event.snapshot_url ? (
          <img className="safety-camera-image" src={event.snapshot_url} alt="Safety alert image" />
        ) : (
          <div className="safety-camera-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p>Image caméra à venir</p>
          </div>
        )}
      </div>

      <div className="safety-details-panel">
        <dl className="safety-details-list">
          <div className="safety-detail-row">
            <dt>Event Type</dt>
            <dd>{eventLabel(event.event)}</dd>
          </div>
          <div className="safety-detail-row">
            <dt>Time</dt>
            <dd>{formatDate(event.timestamp)} · {formatTime(event.timestamp)}</dd>
          </div>
          {violations.length > 0 && (
            <div className="safety-detail-row">
              <dt>Violations</dt>
              <dd>
                <ul className="safety-violations-list">
                  {violations.map((violation) => (
                    <li key={violation}>{violation}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}