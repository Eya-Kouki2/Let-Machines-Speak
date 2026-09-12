import type { SafetyEvent } from "./types";

const EVENT_LABELS: Record<string, string> = {
  no_helmet: "No helmet",
  restricted_zone_entry: "Restricted area",
  helmet_ok: "Helmet OK",
};

export function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

export function isViolationEvent(eventType: string): boolean {
  return eventType !== "helmet_ok";
}

export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sortByTimestampDesc(events: SafetyEvent[]): SafetyEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
export type EventSeverity = "danger" | "warning" | "success";

// Détermine la couleur/icône pour un type d'événement. Le fallback "warning"
// garantit qu'un futur type ajouté par l'IA reste visible sans casser l'UI.
export function eventSeverity(eventType: string): EventSeverity {
  if (eventType === "helmet_ok") return "success";
  if (eventType === "no_helmet") return "danger";
  return "warning";
}