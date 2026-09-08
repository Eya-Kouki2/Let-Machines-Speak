import { useWorkerSafetyData } from "./useWorkerSafetyData";
import { SafetyAlertBanner } from "./SafetyAlertBanner";
import { EventDetailsPanel } from "./EventDetailsPanel";
import { RecentEventsTable } from "./RecentEventsTable";
import { formatDate, formatTime } from "./format";

export function SafetyMonitoringPage() {
  const { events, latestAlert, isLoading } = useWorkerSafetyData();

  if (isLoading) {
    return <p className="safety-page-loading">Chargement…</p>;
  }

  const now = new Date().toISOString();

  return (
    <div className="safety-page">
      <div className="safety-page-header">
        <div>
          <h1 className="safety-page-title">Safety Monitoring</h1>
          <p className="safety-page-subtitle">Real-time detection and alerts for a safer workplace</p>
        </div>
        <div className="safety-page-meta">
          <span>{formatDate(now)} · {formatTime(now)}</span>
          <span className="safety-live-badge"><span className="safety-live-dot" /> Live</span>
        </div>
      </div>

      {latestAlert && <SafetyAlertBanner alert={latestAlert} />}
      {latestAlert && <EventDetailsPanel event={latestAlert} />}

      <RecentEventsTable events={events} />
    </div>
  );
}