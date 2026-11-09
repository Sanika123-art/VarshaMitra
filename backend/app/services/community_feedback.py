"""Persistent, contact-free farmer feedback storage."""

import logging
import sqlite3
import uuid
import contextlib
from datetime import datetime, timezone
from typing import Any, Iterator

from app.schemas.community import FarmerFeedbackCreate, FarmerFeedbackList, FarmerFeedbackPost
from app.services.dataset.storage import dataset_storage

logger = logging.getLogger("varshamitra.community")


@contextlib.contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(dataset_storage.db_path, timeout=5.0)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS farmer_feedback (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                district TEXT NOT NULL,
                taluka TEXT,
                rating TEXT NOT NULL DEFAULT 'suggestion',
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        with connection:
            yield connection
    finally:
        connection.close()


def list_feedback(limit: int = 100) -> FarmerFeedbackList:
    """Return recent, farmer-submitted posts without collecting contact information."""
    try:
        with _connection() as connection:
            rows = connection.execute(
                """
                SELECT id, display_name, district, taluka, rating, message, created_at
                FROM farmer_feedback
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
    except sqlite3.Error:
        logger.exception("Could not read farmer feedback.")
        raise

    posts = [
        FarmerFeedbackPost(
            id=row["id"],
            display_name=row["display_name"],
            district=row["district"],
            taluka=row["taluka"],
            rating=row["rating"],
            message=row["message"],
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return FarmerFeedbackList(items=posts)


def create_feedback(payload: FarmerFeedbackCreate) -> FarmerFeedbackPost:
    """Persist a single feedback post, defaulting to anonymous display."""
    post_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    values: tuple[Any, ...] = (
        post_id,
        payload.display_name or "शेतकरी मित्र",
        payload.district,
        payload.taluka,
        payload.rating,
        payload.message,
        created_at.isoformat(),
    )
    try:
        with _connection() as connection:
            connection.execute(
                """
                INSERT INTO farmer_feedback (id, display_name, district, taluka, rating, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                values,
            )
    except sqlite3.Error:
        logger.exception("Could not save farmer feedback.")
        raise

    return FarmerFeedbackPost(
        id=post_id,
        display_name=payload.display_name or "शेतकरी मित्र",
        district=payload.district,
        taluka=payload.taluka,
        rating=payload.rating,
        message=payload.message,
        created_at=created_at,
    )
