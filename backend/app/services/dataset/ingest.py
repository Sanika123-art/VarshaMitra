"""Historical dataset incremental ingestion pipeline.

Pulls verified historical reanalysis or station observations and stores them idempotently.
Can be executed as an async service or standalone CLI command.
"""

import argparse
import asyncio
from datetime import date, datetime, timezone
import os
import sys
from typing import Optional

from fastapi import HTTPException
from app.core.logging import logger
from app.schemas.rainfall import (
    DataType,
    DatasetIngestionSummary,
    HistoricalRainfallRecord,
    QualityStatus,
)
from app.services.dataset.storage import dataset_storage
from app.services.rainfall.factory import get_rainfall_provider
from app.services.rainfall.open_meteo_archive import OpenMeteoArchiveProvider


async def ingest_historical_data(
    block_id: str,
    start_date: date,
    end_date: date,
    provider_key: str = "open-meteo-archive",
) -> DatasetIngestionSummary:
    """Ingest historical rainfall records for a Maharashtra administrative block with deduplication."""
    from app.services.location_service import location_service
    block = location_service.get_block(block_id)
    if not block:
        raise HTTPException(
            status_code=404,
            detail=f"Block '{block_id}' not found in curated Maharashtra locations.",
        )

    provider = get_rainfall_provider(provider_key)

    logger.info(
        f"Starting historical ingestion for {block.name} ({block.district_name}) from {start_date} to {end_date} via {provider_key}"
    )

    if not isinstance(provider, OpenMeteoArchiveProvider):
        # Other providers only expose a 'recent N days' window. Using them here would store recent
        # values under the requested historical dates, which would silently corrupt the dataset.
        raise HTTPException(
            status_code=400,
            detail=(
                f"Provider '{provider_key}' does not support historical date-range ingestion. "
                "Use provider 'open-meteo-archive'."
            ),
        )

    series = await provider.get_historical_range(block, start_date, end_date)

    records = [
        HistoricalRainfallRecord(
            location_id=block.id,
            district_id=block.district_id,
            latitude=block.latitude,
            longitude=block.longitude,
            date=obs.date,
            precipitation_mm=obs.value_mm,
            data_type=obs.data_type,
            source_provider=series.provider.provider_id,
            dataset_product=series.provider.dataset_name,
            quality_status=obs.quality,
            retrieved_at=series.retrieved_at,
        )
        for obs in series.observations
    ]

    inserted, skipped = dataset_storage.insert_records(records)
    missing = sum(1 for r in records if r.precipitation_mm is None)

    summary = DatasetIngestionSummary(
        location_id=block.id,
        start_date=start_date,
        end_date=end_date,
        total_days=len(records),
        ingested_count=inserted,
        skipped_count=skipped,
        missing_days_count=missing,
        data_type=records[0].data_type if records else DataType.REANALYSIS,
        source_provider=provider.provider_id,
        storage_path=os.path.basename(dataset_storage.db_path),
        ingestion_time=datetime.now(timezone.utc),
    )

    logger.info(
        f"Ingestion complete: {inserted} inserted, {skipped} skipped, {missing} missing days across {len(records)} days."
    )
    return summary


def main() -> int:
    """CLI runner for historical dataset ingestion.

    Exit codes: 0 success, 1 ingestion failure (upstream/storage), 2 invalid input.
    """
    parser = argparse.ArgumentParser(description="Ingest historical climate dataset for Maharashtra blocks.")
    parser.add_argument("--block", required=True, help="Block ID (e.g. 'baramati', 'barshi', 'karvir')")
    parser.add_argument("--start", required=True, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", required=True, help="End date (YYYY-MM-DD)")
    parser.add_argument("--provider", default="open-meteo-archive", help="Provider key (default: open-meteo-archive)")

    args = parser.parse_args()

    try:
        start_d = date.fromisoformat(args.start)
        end_d = date.fromisoformat(args.end)
    except ValueError:
        print("error: --start and --end must be valid YYYY-MM-DD dates", file=sys.stderr)
        return 2
    if start_d > end_d:
        print("error: --start must be on or before --end", file=sys.stderr)
        return 2

    print(f"--> Initiating ingestion for '{args.block}' from {start_d} to {end_d}...")
    try:
        summary = asyncio.run(ingest_historical_data(args.block, start_d, end_d, args.provider))
    except HTTPException as exc:
        print(f"error: ingestion failed (HTTP {exc.status_code}): {exc.detail}", file=sys.stderr)
        return 2 if exc.status_code in (400, 404, 422) else 1
    except Exception as exc:  # database or unexpected failure
        logger.exception("Historical ingestion failed")
        print(f"error: ingestion failed: {type(exc).__name__}", file=sys.stderr)
        return 1

    print("\n================ INGESTION SUMMARY ================")
    print(f"Location ID:       {summary.location_id}")
    print(f"Date Range:        {summary.start_date} to {summary.end_date} ({summary.total_days} days)")
    print(f"Records Ingested:  {summary.ingested_count}")
    print(f"Duplicates Skipped:{summary.skipped_count}")
    print(f"Missing Days:      {summary.missing_days_count}")
    print(f"Data Type:         {summary.data_type.value}")
    print(f"Provider:          {summary.source_provider}")
    print(f"Storage File:      {summary.storage_path}")
    print("===================================================\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
