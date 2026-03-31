# Antigravity: Multi-Modal Accident Detection System
## Full Project Plan

This document outlines the architecture and execution plan for both the frontend and backend of the Antigravity project.

### 1. System Architecture

#### Frontend (Next.js)
Responsibilities:
- Provide a real-time command dashboard for safety monitors.
- Display a live grid of video feeds and their current status (Clear / Accident).
- Show an incident sidebar with cards for detected accidents, updating in real-time via Firestore.
- An interactive UI displaying the "Impact Frame", AI-detected severity, type, and recommended action.
- "Agentic Chat" interface allowing text commands that control the UI (e.g., "Show me Cam 2") via tool responses from the backend.

Tech Stack: 
- Next.js (App Router), React, Tailwind CSS, Lucide Icons
- Firebase Client SDK (Firestore real-time listeners)

#### Backend (FastAPI - Python)
Responsibilities:
- Act as the "Sense and Act" engine.
- Provide a Vision Processing Pipeline that extracts frames from looping `.mp4` video feeds.
- Implement the "Sentry Logic":
  - Process 1 frame every 2 seconds.
  - One-Shot Trigger: Hash video filename and loop ID to avoid duplicate alerts for the same event.
- Integrate with Gemini 2.0 Flash (Multimodal) for analyzing video frames to output structured JSON:
  - Accident: true/false
  - Severity: Critical | High | Medium | Low
  - Type: Multi-vehicle | Pedestrian | Hazard
  - Description: short summary
  - Emergency Priority: 1-10
- Provide an Agentic Chat API: Receive text instructions from the frontend, pass them to Gemini with tool definitions (e.g., `show_feed`, `search_incidents`, `get_incident_details`), and return the tool call structured responses to the frontend.
- Write detected incidents to Firestore so the frontend can display them in real-time.

Tech Stack:
- Python (FastAPI, Uvicorn)
- OpenCV (Frame extraction)
- google-genai (Gemini 2.0 Flash SDK)
- Firebase Admin SDK (Firestore)

### 2. Development Milestones

| Phase | Frontend (Friend) | Backend (AI Agent) |
| --- | --- | --- |
| **Phase 1: Setup & Data Prep** | Setup Next.js boilerplate, Tailwind, Firebase config | Setup FastAPI, Firebase Admin, local video frame extraction loop |
| **Phase 2: Vision Pipeline** | Create empty dashboard layout, static video grid | Implement Frame-skip & One-shot logic. Call Gemini 2.0 Flash for frame analysis |
| **Phase 3: Database & Real-time** | Integrate Firestore listeners to map incidents to UI | Persist Gemini JSON results to Firestore upon accident detection |
| **Phase 4: Agentic Chat** | Build Chat UI to send queries to Backend and execute returned tool commands | Create `/chat` endpoint with Gemini 2.0 Function Calling to act as System Commander |
| **Phase 5: Polish & Integration** | Polish cards, modals, "Alert" styling, and transitions | Optimize latency, ensure smooth API responses and robust error handling |

### 3. API Contract (Backend to Frontend)

**Data Models (Firestore `incidents` collection):**
```json
{
  "id": "uuid",
  "camera_id": "cam_01",
  "timestamp": "ISO_STRING",
  "accident": true,
  "severity": "High",
  "type": "Multi-vehicle",
  "description": "Two cars collided at the intersection.",
  "emergency_priority": 8,
  "image_url": "url_to_impact_frame" // Optional if frames are uploaded to Cloud Storage
}
```

**Chat API (`POST /chat`):**
Request:
```json
{
  "message": "Show me Cam 2"
}
```
Response (Agentic Tool Call):
```json
{
  "action": "tool_call",
  "tool_name": "show_feed",
  "parameters": {
    "camera_id": "cam_02"
  }
}
```

### 4. Next Steps for Backend Development
1. Initialize the FastAPI Python project in `/home/rix/projects/OneEye/backend`.
2. Setup the virtual environment and install dependencies.
3. Stub out the FastAPI application and routers.
4. Implement the video processing loop using OpenCV.
5. Setup the Gemini 2.0 Flash integration and prompt definitions.
