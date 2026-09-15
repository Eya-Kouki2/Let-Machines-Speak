import { useMemo } from "react";
import { useWorkerSafetyData } from "./useWorkerSafetyData";
import { SafetyAlertBanner } from "./SafetyAlertBanner";
import { EventDetailsPanel } from "./EventDetailsPanel";
import { RecentEventsTable } from "./RecentEventsTable";
import { downloadSafetyReport } from "../../services/reportService";

export function SafetyMonitoringPage() {
  const { events, latestAlert, isLoading, updateEventStatus } = useWorkerSafetyData();

  // Compute Active KPIs
  const kpis = useMemo(() => {
    const total = events.length;
    const openViolations = events.filter((e) => e.status === "open").length;
    const resolved = events.filter((e) => e.status === "resolved").length;
    const complianceRate = total > 0 ? Math.round(((total - openViolations) / total) * 100) : 100;
    const uniqueZones = new Set(events.map((e) => e.zone)).size || 1;
    const uniqueNodes = new Set(events.map((e) => e.node_id)).size || 1;

    return { total, openViolations, resolved, complianceRate, uniqueZones, uniqueNodes };
  }, [events]);

  // The live panel always shows the very latest alert/event — never changes on table click
  const liveEvent = latestAlert ?? events[0] ?? null;

  const handleResolve = (eventId: string) => {
    updateEventStatus(eventId, "resolved");
  };

  if (isLoading) {
    return (
      <div className="safety-page-shell">
        <div className="safety-loading-card">
          <div className="safety-loading-spinner" />
          <p>Connecting to Edge-AI Vision &amp; Safety Telemetry Stream…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="safety-page-shell">
      {/* ── 1. Page Header ── */}
      <div className="safety-page-header">
        <h1 className="safety-page-title">Worker Safety Monitoring</h1>
      </div>

      {/* ── 2. KPI Cards ── */}
      <section className="safety-kpi-grid">
        <div className={`safety-kpi-card ${kpis.openViolations > 0 ? "kpi-danger" : "kpi-success"}`}>
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Active Violations</span>
            <strong className="safety-kpi-value">{kpis.openViolations}</strong>
            <small className="safety-kpi-sub">
              {kpis.openViolations > 0 ? "Immediate supervisor review" : "All zones compliant"}
            </small>
          </div>
        </div>

        <div className="safety-kpi-card kpi-emerald">
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">PPE Compliance</span>
            <strong className="safety-kpi-value">{kpis.complianceRate}%</strong>
            <small className="safety-kpi-sub">{kpis.resolved} resolved incident(s)</small>
          </div>
        </div>

        <div className="safety-kpi-card kpi-mint">
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">Monitored Zones</span>
            <strong className="safety-kpi-value">{kpis.uniqueZones}</strong>
            <small className="safety-kpi-sub">Active industrial zones</small>
          </div>
        </div>

        <div className="safety-kpi-card kpi-orange">
          <div className="safety-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="2" />
              <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
            </svg>
          </div>
          <div className="safety-kpi-body">
            <span className="safety-kpi-label">AI Vision Nodes</span>
            <strong className="safety-kpi-value">{kpis.uniqueNodes}</strong>
            <small className="safety-kpi-sub">Edge inference cameras</small>
          </div>
        </div>
      </section>

      {/* ── 3. Critical Alert Banner ── */}
      {latestAlert && (
        <SafetyAlertBanner alert={latestAlert} onResolve={handleResolve} />
      )}

      {/* ── 4. Live AI Camera & Telemetry Feed — always tracks the latest incoming alert ── */}
      {liveEvent && (
        <EventDetailsPanel event={liveEvent} onResolve={handleResolve} />
      )}

      {/* ── 5. Incident History Log — inspect any event inline via the drawer ── */}
      <RecentEventsTable
        events={events}
        onResolve={handleResolve}
        onExportReport={() => downloadSafetyReport(events, latestAlert)}
      />
    </div>
  );
}