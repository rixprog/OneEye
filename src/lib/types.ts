// Types for the Road Hazard Sentry system

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type IncidentType = "Multi-vehicle" | "Pedestrian" | "Hazard" | "Single-vehicle";

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  videoSrc: string;
  status: "clear" | "alert" | "offline";
  lastChecked: string;
}

export interface Incident {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  severity: Severity;
  type: IncidentType;
  description: string;
  emergencyPriority: number;
  frameUrl?: string;
  acknowledged: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}
