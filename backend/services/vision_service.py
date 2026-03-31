"""
Vision Service — Frame extraction & One-Shot Trigger logic.

This module handles:
1. Looping an MP4 video as a simulated camera feed.
2. Extracting 1 frame every N seconds.
3. One-Shot Trigger: hashing (video_filename + loop_id) so that if an accident
   is detected in Loop_01, the system skips further analysis until Loop_02.
"""

import asyncio
import base64
import hashlib
import logging
import os
from typing import Dict

import cv2

logger = logging.getLogger("antigravity.vision")

# Global state tracking for each camera
_camera_tasks: Dict[str, asyncio.Task] = {}
_camera_states: Dict[str, dict] = {}
_analyzed_hashes: set = set()  # One-Shot trigger memory


def _make_trigger_hash(video_filename: str, loop_id: int) -> str:
    """Create a unique hash for a video file + loop iteration."""
    raw = f"{video_filename}::loop_{loop_id}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _frame_to_base64(frame) -> str:
    """Encode an OpenCV frame (numpy array) as a base64 JPEG string."""
    _, buffer = cv2.imencode(".jpg", frame)
    return base64.b64encode(buffer).decode("utf-8")


async def start_camera_loop(
    camera_id: str,
    video_path: str,
    interval: float,
    on_frame_callback,
):
    """
    Start a looping video feed simulation for a given camera.

    Args:
        camera_id: Identifier for the camera (e.g., "cam_01").
        video_path: Absolute path to the .mp4 file.
        interval: Seconds between frame extractions.
        on_frame_callback: An async callable(camera_id, frame_b64, loop_id) that
                           will be invoked for each extracted frame.
    """
    if not os.path.isfile(video_path):
        logger.error(f"Video file not found: {video_path}")
        return

    _camera_states[camera_id] = {
        "status": "running",
        "loop_id": 0,
        "frames_analyzed": 0,
    }

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_skip = int(fps * interval)  # how many frames to skip each step

    logger.info(
        f"[{camera_id}] Starting vision loop — "
        f"FPS={fps}, total_frames={total_frames}, skip={frame_skip}"
    )

    loop_id = 0

    try:
        while _camera_states.get(camera_id, {}).get("status") == "running":
            loop_id += 1
            _camera_states[camera_id]["loop_id"] = loop_id
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # rewind to start

            trigger_hash = _make_trigger_hash(os.path.basename(video_path), loop_id)
            already_triggered = trigger_hash in _analyzed_hashes

            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break  # end of video — will loop

                if frame_idx % frame_skip == 0 and not already_triggered:
                    frame_b64 = _frame_to_base64(frame)
                    _camera_states[camera_id]["frames_analyzed"] += 1

                    # Call Gemini analysis (via callback)
                    triggered = await on_frame_callback(camera_id, frame_b64, loop_id)

                    if triggered:
                        # Mark this loop as "done" — One-Shot
                        _analyzed_hashes.add(trigger_hash)
                        already_triggered = True
                        logger.info(
                            f"[{camera_id}] Accident detected in loop {loop_id}. "
                            "Skipping remaining frames for this loop."
                        )

                frame_idx += 1
                # Yield control so other async tasks can run
                if frame_idx % (frame_skip * 2) == 0:
                    await asyncio.sleep(0)

            logger.info(f"[{camera_id}] Loop {loop_id} complete. Rewinding.")
            await asyncio.sleep(interval)  # brief pause between loops

    except asyncio.CancelledError:
        logger.info(f"[{camera_id}] Vision loop cancelled.")
    finally:
        cap.release()
        _camera_states[camera_id]["status"] = "stopped"


def stop_camera(camera_id: str):
    """Stop a running camera vision loop."""
    if camera_id in _camera_states:
        _camera_states[camera_id]["status"] = "stopped"
    task = _camera_tasks.pop(camera_id, None)
    if task and not task.done():
        task.cancel()


def get_camera_status(camera_id: str) -> dict:
    return _camera_states.get(camera_id, {"status": "not_started", "loop_id": 0, "frames_analyzed": 0})


def register_task(camera_id: str, task: asyncio.Task):
    _camera_tasks[camera_id] = task


def clear_trigger_memory():
    """Reset the one-shot trigger memory (useful for testing)."""
    _analyzed_hashes.clear()
