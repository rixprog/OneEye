"""
Database Service — Firebase Firestore integration.

Provides functions to read and write incident documents.
Falls back to an in-memory store if Firebase credentials are not configured,
so the system can run without Firebase during development.
"""

import logging
import os
from typing import List, Optional
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("antigravity.db")

# ---------- Firebase Init ---------- #

_firestore_db = None
_use_firebase = False
_memory_store: List[dict] = []  # In-memory fallback


def _init_firebase():
    """Lazily initialize Firebase Admin SDK."""
    global _firestore_db, _use_firebase

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not cred_path or not os.path.isfile(cred_path):
        logger.warning(
            "FIREBASE_CREDENTIALS_PATH not set or file not found. "
            "Using in-memory store. Set it in .env to enable Firestore."
        )
        _use_firebase = False
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        _firestore_db = firestore.client()
        _use_firebase = True
        logger.info("Firebase Firestore initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}. Using in-memory store.")
        _use_firebase = False


# Initialize on import
_init_firebase()


# ---------- CRUD Operations ---------- #

COLLECTION_NAME = "incidents"


async def save_incident(incident: dict) -> str:
    """Save an incident to Firestore (or in-memory fallback). Returns the doc ID."""
    doc_id = incident.get("id", str(hash(str(incident))))

    if _use_firebase and _firestore_db:
        try:
            _firestore_db.collection(COLLECTION_NAME).document(doc_id).set(incident)
            logger.info(f"Incident {doc_id} saved to Firestore.")
        except Exception as e:
            logger.error(f"Firestore write failed: {e}. Saving to memory.")
            _memory_store.append(incident)
    else:
        _memory_store.append(incident)
        logger.info(f"Incident {doc_id} saved to in-memory store. ({len(_memory_store)} total)")

    return doc_id


async def get_incidents(
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = 10,
) -> List[dict]:
    """Fetch incidents with optional filters."""
    if _use_firebase and _firestore_db:
        try:
            query = _firestore_db.collection(COLLECTION_NAME)
            if severity:
                query = query.where("severity", "==", severity)
            if incident_type:
                query = query.where("type", "==", incident_type)
            query = query.order_by("timestamp", direction="DESCENDING").limit(limit)
            docs = query.stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Firestore read failed: {e}")
            return []
    else:
        # In-memory filtering
        results = list(_memory_store)
        if severity:
            results = [r for r in results if r.get("severity") == severity]
        if incident_type:
            results = [r for r in results if r.get("type") == incident_type]
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return results[:limit]


async def get_incident_by_id(incident_id: str) -> Optional[dict]:
    """Get a single incident by ID."""
    if _use_firebase and _firestore_db:
        try:
            doc = _firestore_db.collection(COLLECTION_NAME).document(incident_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Firestore read failed: {e}")
            return None
    else:
        for item in _memory_store:
            if item.get("id") == incident_id:
                return item
        return None


def get_all_incidents_sync() -> List[dict]:
    """Synchronous getter for the in-memory store (used during testing)."""
    return list(_memory_store)
