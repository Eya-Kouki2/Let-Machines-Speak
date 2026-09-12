import type { SafetyEventRow } from "./types";
import { eventLabel, formatDate, formatTime } from "./format";

interface EventDetailsPanelProps {
  event: SafetyEventRow;
}

export function EventDetailsPanel({ event }: EventDetailsPanelProps) {
  return (
    <div className="safety-details-grid">
      {/* Placeholder — l'équipe IA n'envoie pas encore d'image dans le JSON.
          À remplacer par <img src={event.snapshot_url} /> dès que ce champ existe. */}
      <div className="safety-camera-frame">
        <div className="safety-camera-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p>Image caméra à venir</p>
        </div>
        <span className="safety-camera-tag">{event.zone} - {event.node_id}</span>
      </div>

      <div className="safety-details-panel">
        <dl className="safety-details-list">
          <div className="safety-detail-row"><dt>Event ID</dt><dd>{event.event_id}</dd></div>
          <div className="safety-detail-row"><dt>Zone</dt><dd>{event.zone}</dd></div>
          <div className="safety-detail-row"><dt>Node</dt><dd>{event.node_id}</dd></div>
          <div className="safety-detail-row"><dt>Event Type</dt><dd>{eventLabel(event.event)}</dd></div>
          <div className="safety-detail-row"><dt>Person Track ID</dt><dd>{event.person_track_id}</dd></div>
          <div className="safety-detail-row">
            <dt>Timestamp</dt>
            <dd>{formatDate(event.timestamp)} · {formatTime(event.timestamp)}</dd>
          </div>
        </dl>

        <div className="safety-details-actions">
          <button type="button" className="safety-btn safety-btn--primary" disabled>View Full Image</button>
          <button type="button" className="safety-btn safety-btn--secondary" disabled>Download</button>
        </div>
      </div>
    </div>
  );
}