"""Service for querying Maharashtra administrative locations."""

from typing import List, Optional
from app.data.locations_data import (
    BLOCKS_MAP,
    DISTRICTS_MAP,
    get_coverage_metadata,
)
from app.schemas.location import (
    BlockDetail,
    BlockSummary,
    CoverageMetadata,
    DistrictDetail,
    DistrictSummary,
)


class LocationService:
    """Service abstraction for location queries and validation."""

    def list_districts(self) -> List[DistrictSummary]:
        """Return all districts in the curated subset."""
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

    def list_blocks(self, district_id: Optional[str] = None) -> List[BlockSummary]:
        """Return all blocks, optionally filtered by district ID."""
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
                for b in BLOCKS_MAP.values()
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
            for b in BLOCKS_MAP.values()
        ]

    def get_block(self, block_id: str) -> Optional[BlockDetail]:
        """Retrieve specific block details with parent hierarchy."""
        return BLOCKS_MAP.get(block_id.strip().lower())

    def get_coverage(self) -> CoverageMetadata:
        """Return dataset coverage limitations and metadata."""
        return get_coverage_metadata()


location_service = LocationService()
