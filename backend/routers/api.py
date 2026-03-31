"""
API Router — All HTTP endpoints for the Antigravity backend.

Endpoints:
  POST /api/chat          — Agentic chat with Gemini Function Calling
  POST /api/start_vision  — Start a camera vision loop
  POST /api/stop_vision   — Stop a camera vision loop
  GET  /api/status/{cam}  — Get status of a camera loop
  GET  /api/incidents     — List incidents (with optional filters)
  GET  /api/incidents/{id}— Get a single incident by ID
"""

import asyncio
import logging
import os
from typing import Optional

from fastapi import APIRouter, HTTPException

from models.schemas import (
    ChatRequest,
    ChatResponse,
    VisionStartRequest,
    VisionStatus,
    Incident,
)
from services import gemini_service, vision_service, db_service

logger = logging.getLogger("antigravity.api")
router = APIRouter(prefix="/api")


# ---------- Chat ---------- #

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the System Commander agent."""
    result = await gemini_service.chat_agent(req.message)
    return ChatResponse(**result)


# ---------- Vision Control ---------- #

async def _on_frame_analyzed(camera_id: str, frame_b64: str, loop_id: int) -> bool:
    """
    Callback invoked by vision_service for each extracted frame.
    Sends the frame to Gemini for analysis. Returns True if accident was detected.
    """
    analysis = await gemini_service.analyze_frame(frame_b64)

    if analysis.get("accident"):
        incident = Incident(
            camera_id=camera_id,
            severity=analysis.get("severity", "Unknown"),
            type=analysis.get("type", "Unknown"),
            description=analysis.get("description", "Accident detected."),
            emergency_priority=analysis.get("emergency_priority", 5),
            frame_base64=frame_b64,
        )
        await db_service.save_incident(incident.model_dump())
        logger.info(f"🚨 Incident saved for {camera_id} — {analysis.get('severity')}")
        return True

    return False


@router.post("/start_vision", response_model=VisionStatus)
async def start_vision(req: VisionStartRequest):
    """Start the vision processing loop for a camera."""
    video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos")
    video_path = os.path.join(video_dir, req.video_filename)

    if not os.path.isfile(video_path):
        raise HTTPException(
            status_code=404,
            detail=f"Video file '{req.video_filename}' not found in backend/videos/",
        )

    # Start background task
    task = asyncio.create_task(
        vision_service.start_camera_loop(
            camera_id=req.camera_id,
            video_path=video_path,
            interval=req.interval_seconds,
            on_frame_callback=_on_frame_analyzed,
        )
    )
    vision_service.register_task(req.camera_id, task)

    return VisionStatus(
        camera_id=req.camera_id,
        status="running",
    )


@router.post("/stop_vision")
async def stop_vision(camera_id: str = "cam_01"):
    """Stop the vision processing loop for a camera."""
    vision_service.stop_camera(camera_id)
    return {"camera_id": camera_id, "status": "stopped"}


@router.get("/status/{camera_id}", response_model=VisionStatus)
async def get_status(camera_id: str):
    """Get the current status of a camera feed."""
    state = vision_service.get_camera_status(camera_id)
    return VisionStatus(camera_id=camera_id, **state)


# ---------- Incidents ---------- #

@router.get("/incidents")
async def list_incidents(
    severity: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 10,
):
    """List incidents with optional filters."""
    incidents = await db_service.get_incidents(
        severity=severity,
        incident_type=type,
        limit=limit,
    )
    return {"incidents": incidents, "count": len(incidents)}


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get full details of a specific incident."""
    incident = await db_service.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
