import type { SafetyEventRow } from "./types";
import { eventLabel, eventSeverity, formatTime } from "./format";

interface RecentEventsTableProps {
  events: SafetyEventRow[];
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
  return (
    <div className="safety-table-card">
      <div className="safety-table-header">
        <h3 className="safety-table-title">Recent Safety Events</h3>
        <a href="#" className="safety-table-viewall">View All →</a>
      </div>

      <table className="safety-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Zone</th>
            <th>Person ID</th>
            <th>Node</th>
            <th>Timestamp</th>
            <th>Status</th>
            <th aria-label="Preview"></th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt) => {
            const severity = eventSeverity(evt.event);
            return (
              <tr key={evt.event_id}>
                <td>
                  <span className={`safety-event-tag safety-event-tag--${severity}`}>
                    <span className="safety-event-dot" />
                    {eventLabel(evt.event)}
                  </span>
                </td>
                <td>{evt.zone}</td>
                <td>{evt.person_track_id}</td>
                <td>{evt.node_id}</td>
                <td>{formatTime(evt.timestamp)}</td>
                <td>
                  <span className={`safety-status-pill safety-status-pill--${evt.status}`}>
                    {evt.status === "open" ? "Open" : "Resolved"}
                  </span>
                </td>
                <td>
                  <div className="safety-thumb-placeholder" title="Aperçu non disponible (à venir)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}