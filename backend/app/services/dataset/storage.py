"""Persistent storage interface for the historical rainfall dataset.

Uses SQLite with composite primary keys for guaranteed idempotency and deduplication.
Compatible with future migration to PostgreSQL / TimescaleDB.
"""

import contextlib
from datetime import date, datetime, timezone
import os
from pathlib import Path
import sqlite3
from typing import Any, Dict, Iterator, List, Optional, Tuple

from app.schemas.rainfall import DataType, HistoricalRainfallRecord, QualityStatus


class HistoricalDatasetStorage:
    """Manages persistent storage, deduplication, and retrieval of climate dataset records."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path:
            self._db_path = Path(db_path)
        else:
            # Default to backend/data/historical_rainfall.sqlite
            backend_dir = Path(__file__).resolve().parent.parent.parent.parent
            data_dir = backend_dir / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            self._db_path = data_dir / "historical_rainfall.sqlite"

        self._init_db()

    @property
    def db_path(self) -> str:
        return str(self._db_path)

    @contextlib.contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Initialize database schema with primary key constraints for deduplication."""
        with self._connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS historical_rainfall (
                    location_id TEXT NOT NULL,
                    district_id TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    observation_date TEXT NOT NULL,
                    precipitation_mm REAL,
                    data_type TEXT NOT NULL,
                    source_provider TEXT NOT NULL,
                    dataset_product TEXT NOT NULL,
                    quality_status TEXT NOT NULL,
                    retrieved_at TEXT NOT NULL,
                    PRIMARY KEY (location_id, observation_date, source_provider, data_type)
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_hist_loc_date 
                ON historical_rainfall(location_id, observation_date)
                """
            )
            conn.commit()

    def insert_records(self, records: List[HistoricalRainfallRecord]) -> Tuple[int, int]:
        """Insert records with deduplication. Returns (inserted_or_updated_count, skipped_count)."""
        if not records:
            return 0, 0

        inserted_count = 0
        skipped_count = 0

        with self._connection() as conn:
            cursor = conn.cursor()
            for r in records:
                # Check if exact record exists with same precipitation value
                cursor.execute(
                    """
                    SELECT precipitation_mm, quality_status FROM historical_rainfall
                    WHERE location_id = ? AND observation_date = ? AND source_provider = ? AND data_type = ?
                    """,
                    (r.location_id, r.date.isoformat(), r.source_provider, r.data_type.value),
                )
                existing = cursor.fetchone()

                if existing:
                    existing_precip = existing["precipitation_mm"]
                    existing_quality = existing["quality_status"]
                    # If same value and quality, skip to avoid needless disk writes
                    if existing_precip == r.precipitation_mm and existing_quality == r.quality_status.value:
                        skipped_count += 1
                        continue

                cursor.execute(
                    """
                    INSERT INTO historical_rainfall (
                        location_id, district_id, latitude, longitude,
                        observation_date, precipitation_mm, data_type,
                        source_provider, dataset_product, quality_status, retrieved_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(location_id, observation_date, source_provider, data_type) DO UPDATE SET
                        precipitation_mm = excluded.precipitation_mm,
                        quality_status = excluded.quality_status,
                        retrieved_at = excluded.retrieved_at
                    """,
                    (
                        r.location_id,
                        r.district_id,
                        r.latitude,
                        r.longitude,
                        r.date.isoformat(),
                        r.precipitation_mm,
                        r.data_type.value,
                        r.source_provider,
                        r.dataset_product,
                        r.quality_status.value,
                        r.retrieved_at.isoformat(),
                    ),
                )
                inserted_count += 1

            conn.commit()

        return inserted_count, skipped_count

    def query_records(
        self,
        location_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        data_type: Optional[DataType] = None,
    ) -> List[HistoricalRainfallRecord]:
        """Retrieve stored historical records with optional date and type filters."""
        query = "SELECT * FROM historical_rainfall WHERE location_id = ?"
        params: List[Any] = [location_id]

        if start_date:
            query += " AND observation_date >= ?"
            params.append(start_date.isoformat())
        if end_date:
            query += " AND observation_date <= ?"
            params.append(end_date.isoformat())
        if data_type:
            query += " AND data_type = ?"
            params.append(data_type.value)

        query += " ORDER BY observation_date ASC"

        records: List[HistoricalRainfallRecord] = []
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            for row in cursor.fetchall():
                precip = float(row["precipitation_mm"]) if row["precipitation_mm"] is not None else None
                records.append(
                    HistoricalRainfallRecord(
                        location_id=row["location_id"],
                        district_id=row["district_id"],
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        date=date.fromisoformat(row["observation_date"]),
                        precipitation_mm=precip,
                        data_type=DataType(row["data_type"]),
                        source_provider=row["source_provider"],
                        dataset_product=row["dataset_product"],
                        quality_status=QualityStatus(row["quality_status"]),
                        retrieved_at=datetime.fromisoformat(row["retrieved_at"]),
                    )
                )

        return records

    def get_dataset_summary(self, location_id: Optional[str] = None) -> Dict[str, Any]:
        """Compute coverage, total records, and completeness statistics."""
        with self._connection() as conn:
            cursor = conn.cursor()
            if location_id:
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_records,
                        COUNT(precipitation_mm) as valid_records,
                        MIN(observation_date) as min_date,
                        MAX(observation_date) as max_date,
                        SUM(precipitation_mm) as total_mm
                    FROM historical_rainfall
                    WHERE location_id = ?
                    """,
                    (location_id,),
                )
            else:
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_records,
                        COUNT(precipitation_mm) as valid_records,
                        MIN(observation_date) as min_date,
                        MAX(observation_date) as max_date,
                        SUM(precipitation_mm) as total_mm
                    FROM historical_rainfall
                    """
                )
            row = cursor.fetchone()

        total = row["total_records"] if row else 0
        valid = row["valid_records"] if row else 0
        missing = total - valid

        return {
            "location_id": location_id or "all_locations",
            "total_records": total,
            "valid_records": valid,
            "missing_records": missing,
            "min_date": row["min_date"] if row else None,
            "max_date": row["max_date"] if row else None,
            "total_precipitation_mm": round(row["total_mm"], 2) if row and row["total_mm"] else 0.0,
            "storage_file": self._db_path.name,
        }


# Singleton instance
dataset_storage = HistoricalDatasetStorage()
