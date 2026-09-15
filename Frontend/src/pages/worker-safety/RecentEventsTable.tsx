import { useState, useMemo } from "react";
import type { SafetyEventRow } from "./types";
import { eventLabel, eventSeverity, formatDate, formatTime } from "./format";
import { EventDetailsPanel } from "./EventDetailsPanel";

interface RecentEventsTableProps {
  events: SafetyEventRow[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: SafetyEventRow) => void;
  onResolve?: (eventId: string) => void;
  onExportReport?: () => void;
}

export function RecentEventsTable({
  events,
  selectedEventId,
  onSelectEvent,
  onResolve,
  onExportReport,
}: RecentEventsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "danger">("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  // Track which row is expanded inline (independent of the top panel)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const zones = useMemo(() => {
    const set = new Set(events.map((e) => e.zone));
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchLabel = eventLabel(evt.event).toLowerCase().includes(q);
        const matchZone = evt.zone.toLowerCase().includes(q);
        const matchNode = evt.node_id.toLowerCase().includes(q);
        const matchTrack = String(evt.person_track_id).includes(q);
        if (!matchLabel && !matchZone && !matchNode && !matchTrack) return false;
      }
      if (statusFilter === "open" && evt.status !== "open") return false;
      if (statusFilter === "resolved" && evt.status !== "resolved") return false;
      if (statusFilter === "danger" && eventSeverity(evt.event) !== "danger") return false;
      if (zoneFilter !== "all" && evt.zone !== zoneFilter) return false;
      return true;
    });
  }, [events, searchTerm, statusFilter, zoneFilter]);

  function handleInspect(evt: SafetyEventRow, e: React.MouseEvent) {
    e.stopPropagation();
    // Toggle: close if same row clicked again
    setExpandedId((prev) => (prev === evt.event_id ? null : evt.event_id));
    // Also notify parent (keeps KPI / alert banner in sync)
    onSelectEvent?.(evt);
  }

  return (
    <div className="safety-table-card">
      <div className="safety-table-header-row">
        <div>
          <div className="safety-table-kicker">INCIDENT &amp; COMPLIANCE LOG</div>
          <h3 className="safety-table-title">Recent Safety Events ({filteredEvents.length})</h3>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="safety-table-controls">
          <div className="safety-search-wrap">
            <span className="safety-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search event, zone, track ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="safety-search-input"
            />
          </div>

          <div className="safety-filter-pills">
            {(["all", "open", "resolved", "danger"] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`safety-pill-btn ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === "all" ? "All" : st === "open" ? "Open Violations" : st === "resolved" ? "Resolved" : "Critical"}
              </button>
            ))}

            {zones.length > 1 && (
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="safety-zone-select"
              >
                <option value="all">All Zones</option>
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            )}
          </div>

          {onExportReport && (
            <button
              type="button"
              className="safety-btn-export-pdf"
              onClick={onExportReport}
            >
              <span className="btn-icon">📥</span> Download Safety PDF Report
            </button>
          )}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="safety-table-empty">
          <span className="empty-icon">🛡️</span>
          <p>No safety events match your current filter parameters.</p>
        </div>
      ) : (
        <div className="safety-table-scroll">
          <table className="safety-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Zone</th>
                <th>Node ID</th>
                <th>Track ID</th>
                <th>Detection Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => {
                const severity = eventSeverity(evt.event);
                const isSelected = selectedEventId === evt.event_id;
                const isExpanded = expandedId === evt.event_id;

                return (
                  <>
                    <tr
                      key={evt.event_id}
                      className={`safety-table-row ${isSelected ? "row-selected" : ""} ${evt.status === "open" ? "row-open" : ""} ${isExpanded ? "row-expanded-active" : ""}`}
                    >
                      <td>
                        <span className={`safety-event-tag safety-event-tag--${severity}`}>
                          <span className="safety-event-dot" />
                          <strong>{eventLabel(evt.event)}</strong>
                        </span>
                      </td>
                      <td>
                        <span className="safety-zone-badge">{evt.zone}</span>
                      </td>
                      <td>
                        <span className="safety-node-code">{evt.node_id}</span>
                      </td>
                      <td>
                        <span className="safety-track-pill">#TRK-{String(evt.person_track_id).padStart(3, '0')}</span>
                      </td>
                      <td>
                        <div className="safety-time-cell">
                          <span className="time-primary">{formatTime(evt.timestamp)}</span>
                          <span className="time-sub">{formatDate(evt.timestamp)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`safety-status-pill safety-status-pill--${evt.status}`}>
                          <span className="status-dot" />
                          {evt.status === "open" ? "Active Alert" : "Resolved"}
                        </span>
                      </td>
                      <td>
                        <div className="safety-row-actions">
                          <button
                            type="button"
                            className={`safety-row-btn-inspect ${isExpanded ? "active" : ""}`}
                            onClick={(e) => handleInspect(evt, e)}
                            title="Inspect event details inline"
                          >
                            {isExpanded ? "▲ Close" : "👁 Inspect"}
                          </button>
                          {evt.status === "open" && onResolve && (
                            <button
                              type="button"
                              className="safety-row-btn-resolve"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolve(evt.event_id);
                              }}
                              title="Mark Violation as Resolved"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Inline expandable details drawer ── */}
                    {isExpanded && (
                      <tr key={`${evt.event_id}-drawer`} className="safety-inline-drawer-row">
                        <td colSpan={7} className="safety-inline-drawer-cell">
                          <div className="safety-inline-drawer-inner">
                            <EventDetailsPanel
                              event={evt}
                              onResolve={onResolve}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}