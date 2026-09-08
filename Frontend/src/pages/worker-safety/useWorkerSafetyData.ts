import { useEffect, useState } from "react";
import type { SafetyEventRow } from "./types";

// Données de démo, au même format que ce qu'enverra le vrai backend
// (voir GET /api/safety/history et le flux WebSocket).
const MOCK_EVENTS: SafetyEventRow[] = [
  {
    event_id: "zone1-20260829-00028",
    timestamp: "2026-08-29T12:31:12.150Z",
    node_id: "safety-node-01",
    zone: "Zone1",
    event: "no_helmet",
    person_track_id: 3,
    status: "open",
  },
  {
    event_id: "zone2-20260829-00027",
    timestamp: "2026-08-29T12:28:43.000Z",
    node_id: "safety-node-02",
    zone: "Zone2",
    event: "restricted_zone_entry",
    person_track_id: 7,
    status: "open",
  },
  {
    event_id: "zone1-20260829-00026",
    timestamp: "2026-08-29T12:24:17.000Z",
    node_id: "safety-node-01",
    zone: "Zone1",
    event: "helmet_ok",
    person_track_id: 5,
    status: "resolved",
  },
  {
    event_id: "zone3-20260829-00025",
    timestamp: "2026-08-29T12:20:05.000Z",
    node_id: "safety-node-03",
    zone: "Zone3",
    event: "restricted_zone_entry",
    person_track_id: 2,
    status: "open",
  },
  {
    event_id: "zone2-20260829-00024",
    timestamp: "2026-08-29T12:15:32.000Z",
    node_id: "safety-node-02",
    zone: "Zone2",
    event: "helmet_ok",
    person_track_id: 8,
    status: "resolved",
  },
];

interface UseWorkerSafetyDataResult {
  events: SafetyEventRow[];
  latestAlert: SafetyEventRow | null;
  isLoading: boolean;
}

/**
 * TODO: remplacer ce hook par un vrai appel à votre API + un abonnement
 * WebSocket quand le backend sera prêt. La forme des données (SafetyEventRow[])
 * ne devrait pas changer, donc les composants n'auront rien à modifier.
 */
export function useWorkerSafetyData(): UseWorkerSafetyDataResult {
  const [events, setEvents] = useState<SafetyEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(MOCK_EVENTS);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const latestAlert = events.find((e) => e.status === "open") ?? null;

  return { events, latestAlert, isLoading };
}