import { useEffect, useState, useCallback } from "react";
import type { SafetyEventRow } from "./types";
import { apiRequest } from "../../services/apiClient";
import { getMediaUrl } from "../../services/profileApi";
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
  _id?: string;
  event_id?: string;
  timestamp: string;
  node_id?: string;
  zone: string;
  event: string;
  person_track_id?: number;
  confidence?: number;
  status: "open" | "acknowledged" | "resolved";
  violations?: string[];
  snapshot_url?: string;
}

interface UseWorkerSafetyDataResult {
  events: SafetyEventRow[];
  latestAlert: SafetyEventRow | null;
  isLoading: boolean;
  updateEventStatus: (eventId: string, newStatus: "open" | "resolved") => void;
}

function mapBackendEvent(ev: BackendSafetyEvent): SafetyEventRow {
  const eventId = ev.event_id || ev._id || `safety-${Date.now()}`;
  return {
    event_id: eventId,
    timestamp: ev.timestamp,
    node_id: ev.node_id || `safety-${ev.zone.toLowerCase().replace(/\s+/g, '-')}`,
    zone: ev.zone,
    event: ev.event,
    person_track_id: ev.person_track_id ?? 1,
    confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.98,
    status: ev.status === "open" ? "open" : "resolved",
    violations: Array.isArray(ev.violations) ? ev.violations : [],
    snapshot_url: ev.snapshot_url ? getMediaUrl(ev.snapshot_url) : undefined,
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

  // Real-time socket sync with backend
  useEffect(() => {
    const handleSafetyEvent = (payload?: { event?: SafetyEventRow }) => {
      const next = payload?.event;
      if (next) {
        setEvents((current) => [
          { ...next, status: next.status ?? "open" },
          ...current.filter((e) => e.event_id !== next.event_id),
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

  const updateEventStatus = useCallback(async (eventId: string, newStatus: "open" | "resolved") => {
    // Optimistic UI update
    setEvents((current) =>
      current.map((e) => (e.event_id === eventId ? { ...e, status: newStatus } : e))
    );

    // Persist to backend database
    try {
      await apiRequest(`/api/safety/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Retain optimistic update or refresh if needed
    }
  }, []);

  const latestAlert = events.find((e) => e.status === "open") ?? null;

  return { events, latestAlert, isLoading, updateEventStatus };
}