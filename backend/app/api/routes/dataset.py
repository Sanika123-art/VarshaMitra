"""API routes for dataset discovery, source inventory, and persistent storage management."""

from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.schemas.rainfall import (
    DatasetIngestionSummary,
    HistoricalRainfallRecord,
    SourceInventoryItem,
)
from app.services.dataset.ingest import ingest_historical_data
from app.services.dataset.inventory import get_source_inventory
from app.services.dataset.storage import dataset_storage
from app.services.location_service import location_service

router = APIRouter(prefix="/dataset", tags=["Dataset & Ingestion Pipeline"])


class IngestRequest(BaseModel):
    block_id: str = Field(..., description="Target Maharashtra block ID", examples=["baramati"])
    start_date: date = Field(..., description="Start date (YYYY-MM-DD)", examples=["2023-06-01"])
    end_date: date = Field(..., description="End date (YYYY-MM-DD)", examples=["2023-10-31"])
    provider: str = Field(default="open-meteo-archive", description="Provider key", examples=["open-meteo-archive"])


@router.get(
    "/inventory",
    response_model=List[SourceInventoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get Evaluated Data Sources Inventory",
    description="Returns comprehensive catalog of all evaluated candidate sources (IMD, ERA5-Land, Open-Meteo, NASA GPM, SoilGrids, NWIC) with licensing, coverage, and reachability.",
)
async def list_source_inventory() -> List[SourceInventoryItem]:
    """Retrieve full catalog and status of candidate and integrated data sources."""
    return get_source_inventory()


@router.post(
    "/ingest",
    response_model=DatasetIngestionSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Historical Dataset Window",
    description="Trigger incremental historical data ingestion for a Maharashtra block into local persistent storage.",
)
async def trigger_historical_ingestion(request: IngestRequest) -> DatasetIngestionSummary:
    """Run incremental historical data ingestion."""
    block = location_service.get_block(request.block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{request.block_id}' not found in curated Maharashtra dataset.",
        )

    return await ingest_historical_data(
        block_id=request.block_id,
        start_date=request.start_date,
        end_date=request.end_date,
        provider_key=request.provider,
    )


@router.get(
    "/records/{block_id}",
    response_model=List[HistoricalRainfallRecord],
    status_code=status.HTTP_200_OK,
    summary="Get Ingested Historical Records",
    description="Query stored records from local persistent SQLite storage for an administrative block.",
)
async def get_ingested_records(
    block_id: str,
    start_date: Optional[date] = Query(None, description="Optional start date filter"),
    end_date: Optional[date] = Query(None, description="Optional end date filter"),
) -> List[HistoricalRainfallRecord]:
    """Retrieve stored historical records from persistent database."""
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block '{block_id}' not found in curated dataset.",
        )

    return dataset_storage.query_records(
        location_id=block_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/summary",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get Dataset Storage Summary",
    description="Reports total stored records, coverage date bounds, missing counts, and database file location.",
)
async def get_dataset_storage_summary(
    block_id: Optional[str] = Query(None, description="Optional block filter"),
) -> Dict[str, Any]:
    """Get persistent storage summary statistics."""
    return dataset_storage.get_dataset_summary(location_id=block_id)
