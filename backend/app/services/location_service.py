"""Service for querying and resolving Maharashtra administrative locations."""

import contextlib
import re
import sqlite3
from typing import Dict, Iterator, List, Optional
from app.data.locations_data import (
    BLOCKS_MAP,
    DISTRICTS_MAP,
    get_coverage_metadata,
)
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoordinatesPrecision,
    CoverageMetadata,
    CoverageStatus,
    DistrictDetail,
    DistrictSummary,
)
from app.core.logging import logger
from app.services.dataset.storage import dataset_storage
from app.services.geocoding.geocoder import find_nearest_district, find_nearest_taluka, is_in_maharashtra


class LocationService:
    """Service abstraction for location queries, validation, and dynamic registration."""

    def __init__(self):
        self._dynamic_locations: Dict[str, BlockDetail] = {}
        self._persistence_ready = False

    # ------------------------------------------------------------------
    # Durable registry for resolved (non-gazetteer) locations.
    # Without this a backend restart would 404 any place the farmer picked earlier
    # (the browser remembers the id; the server used to forget the place).
    # ------------------------------------------------------------------
    @contextlib.contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(dataset_storage.db_path)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _ensure_persistence(self) -> bool:
        if self._persistence_ready:
            return True
        try:
            with self._connection() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS resolved_locations (
                        location_id TEXT PRIMARY KEY,
                        payload_json TEXT NOT NULL,
                        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                    )
                    """
                )
            self._persistence_ready = True
        except sqlite3.Error as exc:
            logger.warning("Location persistence unavailable: %s", exc)
        return self._persistence_ready

    def _persist_location(self, block: BlockDetail) -> None:
        if not self._ensure_persistence():
            return
        try:
            with self._connection() as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO resolved_locations (location_id, payload_json) VALUES (?, ?)",
                    (block.id.lower(), block.model_dump_json()),
                )
        except sqlite3.Error as exc:
            logger.warning("Could not persist resolved location %s: %s", block.id, exc)

    def _load_persisted_location(self, key: str) -> Optional[BlockDetail]:
        if not self._ensure_persistence():
            return None
        try:
            with self._connection() as conn:
                row = conn.execute(
                    "SELECT payload_json FROM resolved_locations WHERE location_id = ?", (key,)
                ).fetchone()
            if row:
                return BlockDetail.model_validate_json(row["payload_json"])
        except (sqlite3.Error, ValueError) as exc:
            logger.warning("Could not load persisted location %s: %s", key, exc)
        return None

    def list_districts(self) -> List[DistrictSummary]:
        """Return all 36 Maharashtra districts in the statewide dataset."""
        return [
            DistrictSummary(
                id=d.id,
                name=d.name,
                name_mr=d.name_mr,
                state_id=d.state_id,
                latitude=d.latitude,
                longitude=d.longitude,
                block_count=d.block_count,
                coverage_status=d.coverage_status,
            )
            for d in DISTRICTS_MAP.values()
        ]

    def get_district(self, district_id: str) -> Optional[DistrictDetail]:
        """Retrieve district details including child blocks."""
        return DISTRICTS_MAP.get(district_id.strip().lower())

    def list_blocks(self, district_id: Optional[str] = None, include_dynamic: bool = True) -> List[BlockSummary]:
        """Return all blocks/talukas, optionally filtered by district ID.

        `include_dynamic=False` restricts the result to the fixed statewide gazetteer (used by the map
        overview so searches never change which markers the state-wide map evaluates).
        """
        all_blocks = list(BLOCKS_MAP.values())
        if include_dynamic:
            all_blocks += list(self._dynamic_locations.values())
        if district_id:
            d_key = district_id.strip().lower()
            return [
                BlockSummary(
                    id=b.id,
                    name=b.name,
                    name_mr=b.name_mr,
                    district_id=b.district_id,
                    district_name=b.district_name,
                    latitude=b.latitude,
                    longitude=b.longitude,
                    coordinates_precision=b.coordinates_precision,
                    coverage_status=b.coverage_status,
                )
                for b in all_blocks
                if b.district_id == d_key
            ]

        return [
            BlockSummary(
                id=b.id,
                name=b.name,
                name_mr=b.name_mr,
                district_id=b.district_id,
                district_name=b.district_name,
                latitude=b.latitude,
                longitude=b.longitude,
                coordinates_precision=b.coordinates_precision,
                coverage_status=b.coverage_status,
            )
            for b in all_blocks
        ]

    def register_dynamic_location(self, block: BlockDetail) -> BlockDetail:
        """Register a dynamically resolved location into runtime storage."""
        self._dynamic_locations[block.id.lower()] = block
        self._persist_location(block)
        return block

    def get_block(self, block_id: str) -> Optional[BlockDetail]:
        """Retrieve specific block details with parent hierarchy.

        Supports:
        1. Predefined blocks / talukas in BLOCKS_MAP.
        2. Dynamically resolved locations in _dynamic_locations.
        3. Automatic on-the-fly resolution for coordinate slugs (e.g. 'geo_18.6498_72.8765').
        """
        key = block_id.strip().lower()

        # 1. Predefined gazetteer blocks
        if key in BLOCKS_MAP:
            return BLOCKS_MAP[key]

        # 2. Previously registered dynamic locations
        if key in self._dynamic_locations:
            return self._dynamic_locations[key]

        # 2b. Resolved in an earlier server session (durable registry)
        persisted = self._load_persisted_location(key)
        if persisted is not None:
            self._dynamic_locations[key] = persisted
            return persisted

        # 3. Check for coordinate pattern: geo_<lat>_<lon>
        match = re.match(r"^geo_([0-9]+\.?[0-9]*)_([0-9]+\.?[0-9]*)$", key)
        if match:
            try:
                lat = float(match.group(1))
                lon = float(match.group(2))
                if is_in_maharashtra(lat, lon):
                    nearest_d, _ = find_nearest_district(lat, lon)
                    nearest_b, _ = find_nearest_taluka(lat, lon)
                    dynamic_block = BlockDetail(
                        id=key,
                        name=f"Farm near {nearest_b.name}",
                        name_mr=f"{nearest_b.name_mr} जवळ",
                        district_id=nearest_d.id,
                        district_name=nearest_d.name,
                        state_id="mh",
                        state_name="Maharashtra",
                        state_name_mr="महाराष्ट्र",
                        latitude=round(lat, 4),
                        longitude=round(lon, 4),
                        coordinates_precision=CoordinatesPrecision.EXACT_GEOCODED_POINT,
                        coverage_status=CoverageStatus.DYNAMIC_RESOLVED,
                    )
                    self.register_dynamic_location(dynamic_block)
                    return dynamic_block
            except (ValueError, TypeError):
                pass

        return None

    def get_coverage(self) -> CoverageMetadata:
        """Return dataset coverage limitations and metadata."""
        return get_coverage_metadata()


location_service = LocationService()
