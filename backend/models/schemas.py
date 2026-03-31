"""Pydantic models for API requests, responses, and data schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


# ---------- Gemini Vision Analysis ---------- #

class AccidentAnalysis(BaseModel):
    """Structured output from Gemini 2.0 Flash frame analysis."""
    accident: bool
    severity: Optional[str] = Field(None, description="Critical | High | Medium | Low")
    type: Optional[str] = Field(None, description="Multi-vehicle | Pedestrian | Hazard")
    description: Optional[str] = Field(None, description="Short summary of what happened")
    emergency_priority: Optional[int] = Field(None, ge=1, le=10)


class Incident(BaseModel):
    """A confirmed incident stored in Firestore."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    camera_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    accident: bool = True
    severity: str
    type: str
    description: str
    emergency_priority: int
    frame_base64: Optional[str] = Field(None, description="Base64 encoded impact frame")


# ---------- Chat API ---------- #

class ChatRequest(BaseModel):
    message: str


class ToolCall(BaseModel):
    tool_name: str
    parameters: dict


class ChatResponse(BaseModel):
    action: str = "tool_call"
    tool_name: Optional[str] = None
    parameters: Optional[dict] = None
    text: Optional[str] = None  # For plain-text responses


# ---------- Vision Control ---------- #

class VisionStartRequest(BaseModel):
    camera_id: str = "cam_01"
    video_filename: str = "sample.mp4"
    interval_seconds: float = 2.0


class VisionStatus(BaseModel):
    camera_id: str
    status: str  # "running" | "stopped"
    loop_id: int = 0
    frames_analyzed: int = 0
