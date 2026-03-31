"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { CameraFeed, Incident, ChatMessage } from "./types";
import { MOCK_CAMERAS, MOCK_INCIDENTS } from "./mock-data";

interface DashboardState {
  cameras: CameraFeed[];
  incidents: Incident[];
  filteredIncidents: Incident[] | null; // null = show all
  chatMessages: ChatMessage[];
  focusedCameraId: string | null;
  selectedIncidentId: string | null;
  sidebarOpen: boolean;
}

interface DashboardContextType extends DashboardState {
  focusCamera: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  acknowledgeIncident: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  toggleSidebar: () => void;
  searchIncidents: (criteria: string) => Incident[];
  clearFilter: () => void;
  playAlertSound: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [cameras] = useState<CameraFeed[]>(MOCK_CAMERAS);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[] | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "sys-01",
      role: "system",
      content: "System Commander online. Monitoring 6 feeds. 2 active incidents.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // Create alert sound using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Alert tone: two-tone siren effect
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      // Three ascending alert beeps
      playTone(880, now, 0.15);
      playTone(1100, now + 0.18, 0.15);
      playTone(1320, now + 0.36, 0.25);
    } catch {
      // Audio not available, silently fail
    }
  }, []);

  // Play alert sound for unacknowledged incidents on mount
  useEffect(() => {
    const unack = incidents.filter((i) => !i.acknowledged);
    if (unack.length > 0) {
      const timer = setTimeout(() => playAlertSound(), 1000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const focusCamera = useCallback((id: string | null) => {
    setFocusedCameraId(id);
  }, []);

  const selectIncident = useCallback((id: string | null) => {
    setSelectedIncidentId(id);
  }, []);

  const acknowledgeIncident = useCallback((id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, acknowledged: true } : inc))
    );
  }, []);

  const clearFilter = useCallback(() => {
    setFilteredIncidents(null);
  }, []);

  const searchIncidents = useCallback(
    (criteria: string) => {
      const lower = criteria.toLowerCase();
      const results = incidents.filter(
        (inc) =>
          inc.severity.toLowerCase().includes(lower) ||
          inc.type.toLowerCase().includes(lower) ||
          inc.description.toLowerCase().includes(lower) ||
          inc.cameraName.toLowerCase().includes(lower)
      );
      setFilteredIncidents(results);
      return results;
    },
    [incidents]
  );

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMsg: ChatMessage = {
        ...msg,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, newMsg]);

      // Simulate agent response for demo purposes
      if (msg.role === "user") {
        setTimeout(() => {
          const lower = msg.content.toLowerCase();
          let response: Omit<ChatMessage, "id" | "timestamp">;

          // ── show_feed: Focus a camera ──
          if (lower.includes("show") && lower.includes("cam")) {
            const camMatch = lower.match(/cam\s*(\d+)/i);
            const camNum = camMatch ? camMatch[1].padStart(2, "0") : "01";
            const camId = `cam-${camNum}`;
            setFocusedCameraId(camId);
            response = {
              role: "assistant",
              content: `Focusing on CAM ${camNum}. Feed is now highlighted on the main grid.`,
              toolCall: { name: "show_feed", args: { camera_id: camId } },
            };

          // ── get_incident_details: Open incident modal ──
          } else if (lower.includes("detail") || lower.includes("report") && (lower.includes("inc") || lower.includes("accident"))) {
            const incMatch = lower.match(/inc[- ]?(\d+)/i);
            let targetInc = incidents[0]; // default to most recent
            if (incMatch) {
              const incId = `inc-${incMatch[1].padStart(3, "0")}`;
              targetInc = incidents.find((i) => i.id === incId) || incidents[0];
            }
            if (targetInc) {
              setSelectedIncidentId(targetInc.id);
              response = {
                role: "assistant",
                content: `Opening details for ${targetInc.id.toUpperCase()} — ${targetInc.severity} ${targetInc.type} on ${targetInc.cameraName}.`,
                toolCall: { name: "get_incident_details", args: { id: targetInc.id } },
              };
            } else {
              response = {
                role: "assistant",
                content: "No matching incident found.",
              };
            }

          // ── search_incidents: Filter the sidebar ──
          } else if (lower.includes("search") || lower.includes("filter") || lower.includes("find")) {
            // Extract the search term after "search/filter/find"
            const searchTerm = lower.replace(/^.*(search|filter|find)\s*/i, "").trim();
            const criteria = searchTerm || "critical";
            const results = searchIncidents(criteria);
            response = {
              role: "assistant",
              content: `Found ${results.length} incident(s) matching "${criteria}". The sidebar is now filtered.${results.length > 0 ? ` Top result: ${results[0].severity} — ${results[0].description.slice(0, 60)}...` : ""}`,
              toolCall: { name: "search_incidents", args: { criteria } },
            };

          // ── Latest incident ──
          } else if (lower.includes("latest") || lower.includes("recent") || lower.includes("incident") || lower.includes("accident")) {
            const active = incidents.filter((i) => !i.acknowledged);
            if (active.length > 0) {
              setSelectedIncidentId(active[0].id);
              response = {
                role: "assistant",
                content: `Showing the latest incident: ${active[0].severity} ${active[0].type} on ${active[0].cameraName}. ${active[0].description}`,
                toolCall: { name: "get_incident_details", args: { id: active[0].id } },
              };
            } else {
              response = {
                role: "assistant",
                content: "No active incidents. All incidents have been acknowledged.",
              };
            }

          // ── Clear filter ──
          } else if (lower.includes("clear") && lower.includes("filter")) {
            setFilteredIncidents(null);
            response = {
              role: "assistant",
              content: "Sidebar filter cleared. Showing all incidents.",
            };

          // ── Status report ──
          } else if (lower.includes("status")) {
            const active = incidents.filter((i) => !i.acknowledged).length;
            response = {
              role: "assistant",
              content: `System Status: ${cameras.filter((c) => c.status === "clear").length} feeds clear, ${cameras.filter((c) => c.status === "alert").length} alerts, ${cameras.filter((c) => c.status === "offline").length} offline. ${active} unacknowledged incidents.`,
            };

          // ── Fallback ──
          } else {
            response = {
              role: "assistant",
              content:
                'I can help you with:\n• "Show me Cam 2" — focus a camera\n• "Search critical" — filter incidents\n• "Show details INC-001" — open incident report\n• "Latest incident" — show most recent\n• "Status" — system overview\n• "Clear filter" — reset sidebar',
            };
          }

          setChatMessages((prev) => [
            ...prev,
            { ...response, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() },
          ]);
        }, 800);
      }
    },
    [incidents, cameras, searchIncidents]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        cameras,
        incidents,
        filteredIncidents,
        chatMessages,
        focusedCameraId,
        selectedIncidentId,
        sidebarOpen,
        focusCamera,
        selectIncident,
        acknowledgeIncident,
        addChatMessage,
        toggleSidebar,
        searchIncidents,
        clearFilter,
        playAlertSound,
      }}
    >
      {/* Hidden audio element for future backend-triggered alerts */}
      <audio ref={alertAudioRef} preload="none" />
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
