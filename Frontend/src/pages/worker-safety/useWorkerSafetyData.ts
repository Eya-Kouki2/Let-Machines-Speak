import { useEffect, useState, useCallback } from "react";
import type { SafetyEventRow } from "./types";
import { apiRequest } from "../../services/apiClient";
import { useSocket } from "../../hooks/useSocket";

// Fallback demo data
const MOCK_EVENTS: SafetyEventRow[] = [
  {
    event_id: "zone1-20260829-00028",
    timestamp: "2026-08-29T12:31:12.150Z",
    node_id: "safety-node-01",
    zone: "Zone1",
    event: "no_helmet",
    person_track_id: 3,
    status: "open",
    violations: ["Missing: Hardhat"],
    snapshot_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA="
  },
  {
    event_id: "zone2-20260829-00027",
    timestamp: "2026-08-29T12:28:43.000Z",
    node_id: "safety-node-02",
    zone: "Zone2",
    event: "restricted_zone_entry",
    person_track_id: 7,
    status: "open",
    violations: ["Restricted Zone"],
    snapshot_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA="
  },
  {
    event_id: "zone1-20260829-00026",
    timestamp: "2026-08-29T12:24:17.000Z",
    node_id: "safety-node-01",
    zone: "Zone1",
    event: "helmet_ok",
    person_track_id: 5,
    status: "resolved",
    violations: [],
  },
];

interface BackendSafetyEvent {
  _id: string;
  timestamp: string;
  zone: string;
  event: string;
  confidence: number;
  status: "open" | "acknowledged" | "resolved";
  violations?: string[];
  snapshot_url?: string;
}

interface UseWorkerSafetyDataResult {
  events: SafetyEventRow[];
  latestAlert: SafetyEventRow | null;
  isLoading: boolean;
}

function mapBackendEvent(ev: BackendSafetyEvent): SafetyEventRow {
  return {
    event_id: ev._id,
    timestamp: ev.timestamp,
    node_id: `safety-${ev.zone.toLowerCase().replace(/\s+/g, '-')}`,
    zone: ev.zone,
    event: ev.event,
    person_track_id: 1,
    status: ev.status === "open" ? "open" : "resolved",
    violations: Array.isArray(ev.violations) ? ev.violations : [],
    snapshot_url: ev.snapshot_url,
  };
}

export function useWorkerSafetyData(): UseWorkerSafetyDataResult {
  const [events, setEvents] = useState<SafetyEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiRequest<BackendSafetyEvent[]>("/api/safety/events?limit=50");
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data.map(mapBackendEvent));
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch {
      setEvents(MOCK_EVENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Real-time socket sync
  useEffect(() => {
    const handleSafetyEvent = (payload?: { event?: SafetyEventRow }) => {
      const next = payload?.event;
      if (next) {
        setEvents((current) => [
          { ...next, status: next.status ?? "open" },
          ...current,
        ]);
      } else {
        void fetchEvents();
      }
    };

    socket.on("safety:event", handleSafetyEvent);
    socket.on("safety:updated", handleSafetyEvent);
    socket.on("safety:alert", handleSafetyEvent);

    return () => {
      socket.off("safety:event", handleSafetyEvent);
      socket.off("safety:updated", handleSafetyEvent);
      socket.off("safety:alert", handleSafetyEvent);
    };
  }, [socket, fetchEvents]);

  const latestAlert = events.find((e) => e.status === "open") ?? null;

  return { events, latestAlert, isLoading };
}