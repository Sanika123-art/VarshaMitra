"""Pydantic schemas for Maharashtra administrative locations."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CoverageStatus(str, Enum):
    """Honest representation of location coverage status."""
    CURATED_FOCUS_SUBSET = "curated_focus_subset"
    PENDING_GAZETTEER_INGESTION = "pending_gazetteer_ingestion"


class CoordinatesPrecision(str, Enum):
    """Disclaimer on geometric precision of coordinates."""
    APPROXIMATE_CENTROID = "approximate_centroid"
    SURVEY_GRADE_POLYGON = "survey_grade_polygon"


class BlockSummary(BaseModel):
    """Summary of an administrative block/taluka."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique alphanumeric identifier (e.g. 'maval')", examples=["maval"])
    name: str = Field(..., description="English block name", examples=["Maval"])
    name_mr: str = Field(..., description="Marathi block name", examples=["मावळ"])
    district_id: str = Field(..., description="Parent district identifier", examples=["pune"])
    district_name: str = Field(..., description="Parent district name in English", examples=["Pune"])
    latitude: float = Field(..., description="Centroid latitude (approximate)", examples=[18.60])
    longitude: float = Field(..., description="Centroid longitude (approximate)", examples=[73.45])
    coordinates_precision: CoordinatesPrecision = Field(
        default=CoordinatesPrecision.APPROXIMATE_CENTROID,
        description="Geometric precision disclaimer"
    )
    coverage_status: CoverageStatus = Field(
        default=CoverageStatus.CURATED_FOCUS_SUBSET,
        description="Dataset coverage classification"
    )


class BlockDetail(BlockSummary):
    """Detailed view of an administrative block with parent hierarchy."""
    state_id: str = Field(default="mh", description="State identifier", examples=["mh"])
    state_name: str = Field(default="Maharashtra", description="State name", examples=["Maharashtra"])
    state_name_mr: str = Field(default="महाराष्ट्र", description="State name in Marathi", examples=["महाराष्ट्र"])


class DistrictSummary(BaseModel):
    """Summary of a Maharashtra district."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique district identifier (e.g. 'pune')", examples=["pune"])
    name: str = Field(..., description="English district name", examples=["Pune"])
    name_mr: str = Field(..., description="Marathi district name", examples=["पुणे"])
    state_id: str = Field(default="mh", description="State identifier", examples=["mh"])
    latitude: float = Field(..., description="District centroid latitude", examples=[18.5204])
    longitude: float = Field(..., description="District centroid longitude", examples=[73.8567])
    block_count: int = Field(..., description="Number of monitored blocks in current subset", examples=[3])
    coverage_status: CoverageStatus = Field(
        default=CoverageStatus.CURATED_FOCUS_SUBSET,
        description="Statewide coverage classification"
    )


class DistrictDetail(DistrictSummary):
    """Detailed district with list of member blocks."""
    blocks: List[BlockSummary] = Field(default_factory=list, description="Blocks belonging to this district")


class CoverageMetadata(BaseModel):
    """Metadata regarding statewide coverage boundaries and data limitations."""
    model_config = ConfigDict(extra="forbid")

    total_state_districts: int = Field(default=36, description="Total official districts in Maharashtra")
    curated_districts_count: int = Field(..., description="Number of districts available in current focus subset")
    curated_blocks_count: int = Field(..., description="Number of blocks available in current focus subset")
    statewide_coverage_pct: float = Field(..., description="Percentage of Maharashtra districts curated")
    coordinates_precision: CoordinatesPrecision = Field(
        default=CoordinatesPrecision.APPROXIMATE_CENTROID,
        description="Geometric precision note"
    )
    coverage_limitation_statement: str = Field(
        ...,
        description="Clear statement of data limitations"
    )
    gazetteer_source: str = Field(
        default="Local Government Directory (LGD) reference list / VarshaMitra validated subset",
        description="Authoritative source intended for full coverage"
    )


class LocationListResponse(BaseModel):
    """Response envelope for block listings."""
    model_config = ConfigDict(extra="forbid")

    count: int = Field(..., description="Number of records returned")
    items: List[BlockSummary] = Field(..., description="List of administrative blocks")
    coverage_notice: str = Field(..., description="Brief data coverage notice")
