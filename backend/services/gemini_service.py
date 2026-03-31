"""
Gemini Service — Multimodal analysis & Agentic chat with Function Calling.

Uses google-genai SDK to communicate with Gemini 2.0 Flash.
"""

import json
import logging
import os
import base64

from google import genai
from google.genai import types

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("antigravity.gemini")

# ---------- Client Init ---------- #

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")
        _client = genai.Client(api_key=api_key)
    return _client


MODEL_ID = "gemini-2.0-flash"

# ---------- Vision Analysis ---------- #

VISION_SYSTEM_PROMPT = """You are an expert road safety AI monitoring system.
Analyze this frame from a road monitoring camera.
- If an accident or hazardous situation is present, return a JSON object with details.
- If no accident is present, return {"accident": false}.

You MUST respond with ONLY valid JSON matching this schema:
{
  "accident": true,
  "severity": "Critical | High | Medium | Low",
  "type": "Multi-vehicle | Pedestrian | Hazard",
  "description": "Short summary of what happened.",
  "emergency_priority": <integer 1-10>
}

OR if no accident:
{"accident": false}

Do NOT include markdown formatting, code fences, or any text outside the JSON object."""


async def analyze_frame(frame_base64: str) -> dict:
    """
    Send a single frame (base64-encoded JPEG) to Gemini 2.0 Flash
    and get a structured accident analysis.

    Returns a dict matching the AccidentAnalysis schema.
    """
    client = _get_client()

    # Decode base64 to bytes for the API
    image_bytes = base64.b64decode(frame_base64)

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_text(VISION_SYSTEM_PROMPT),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=256,
            ),
        )

        raw_text = response.text.strip()
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

        result = json.loads(raw_text)
        logger.info(f"Gemini analysis result: {result}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e} — raw: {raw_text}")
        return {"accident": False, "error": "parse_failure"}
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return {"accident": False, "error": str(e)}


# ---------- Agentic Chat with Function Calling ---------- #

# Tool definitions for the chat agent
TOOL_DEFINITIONS = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="show_feed",
            description="Focus the dashboard UI on a specific camera feed. Use this when the user wants to see or view a particular camera.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "camera_id": types.Schema(
                        type=types.Type.STRING,
                        description="The camera identifier, e.g. 'cam_01', 'cam_02'",
                    )
                },
                required=["camera_id"],
            ),
        ),
        types.FunctionDeclaration(
            name="search_incidents",
            description="Search and filter incidents based on criteria like severity, type, or time range.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "severity": types.Schema(
                        type=types.Type.STRING,
                        description="Filter by severity: Critical, High, Medium, Low",
                    ),
                    "type": types.Schema(
                        type=types.Type.STRING,
                        description="Filter by type: Multi-vehicle, Pedestrian, Hazard",
                    ),
                    "limit": types.Schema(
                        type=types.Type.INTEGER,
                        description="Maximum number of results to return (default 10)",
                    ),
                },
            ),
        ),
        types.FunctionDeclaration(
            name="get_incident_details",
            description="Get the full details of a specific incident by its ID.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "incident_id": types.Schema(
                        type=types.Type.STRING,
                        description="The unique ID of the incident",
                    )
                },
                required=["incident_id"],
            ),
        ),
    ]
)

CHAT_SYSTEM_INSTRUCTION = """You are the System Commander for OneEye, a road hazard monitoring system.
You have access to tools that control the dashboard.
- If the user asks to "see" or "show" a camera, call 'show_feed' with the camera_id.
- If the user asks about incidents or accidents, call 'search_incidents' with the appropriate filters.
- If the user asks for details about a specific incident, call 'get_incident_details'.
- Be concise and act as an expert dispatcher. If you don't need a tool, respond with a brief text answer.
- When referring to cameras, normalize IDs like "cam 2" or "camera 2" to "cam_02"."""


async def chat_agent(user_message: str) -> dict:
    """
    Process an admin chat message using Gemini 2.0 Flash with function calling.

    Returns a dict with either:
      - {"action": "tool_call", "tool_name": "...", "parameters": {...}}
      - {"action": "text", "text": "..."}
    """
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_INSTRUCTION,
                tools=[TOOL_DEFINITIONS],
                temperature=0.2,
            ),
        )

        # Check if there was a function call
        candidate = response.candidates[0]
        part = candidate.content.parts[0]

        if part.function_call:
            fc = part.function_call
            return {
                "action": "tool_call",
                "tool_name": fc.name,
                "parameters": dict(fc.args) if fc.args else {},
            }
        else:
            return {
                "action": "text",
                "text": part.text or "",
            }

    except Exception as e:
        logger.error(f"Chat agent error: {e}")
        return {
            "action": "text",
            "text": f"I encountered an error processing your request: {str(e)}",
        }
