// Doit rester identique au type SafetyEvent du backend (src/types.ts).
export interface SafetyEvent {
  event_id: string;
  timestamp: string; // ISO 8601
  node_id: string;
  zone: string;
  event: string; // "no_helmet" | "restricted_zone_entry" | futur type
  person_track_id: number;
  snapshot_url?: string; // optionnel: à confirmer avec l'équipe IA
}

export type ZoneState = "safe" | "violation";

export interface ZoneStatus {
  zone: string;
  status: ZoneState;
  activeEventsCount: number;
  lastEvent?: SafetyEvent;
}

export type EventStatus = "open" | "resolved";

// Wrapper d'affichage: un événement + son statut de traitement (acquitté ou non).
export interface SafetyEventRow extends SafetyEvent {
  status: EventStatus;
}