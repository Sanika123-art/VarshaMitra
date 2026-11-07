"""API routes for live APMC Mandi rates and Agmarknet feeds."""

from typing import Optional
from fastapi import APIRouter, Query, status

from app.schemas.mandi import MandiRateResponse
from app.services.mandi.agmarknet import get_mandi_rates_for_crop

router = APIRouter(prefix="/mandi", tags=["Mandi Intelligence"])


@router.get(
    "/rates",
    response_model=MandiRateResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Live APMC Mandi Rates",
    description="Retrieve live daily auction rates, MSP spread, and arrivals from MSAMB and Data.gov.in (Agmarknet).",
)
async def get_mandi_rates(
    crop_id: str = Query(..., description="Crop identifier, e.g. onion, soybean, cotton"),
    block_id: Optional[str] = Query(None, description="Taluka / Block identifier, e.g. niphad, igatpuri"),
) -> MandiRateResponse:
    """Fetch live APMC Mandi rates for a specific crop and local administrative block."""
    return await get_mandi_rates_for_crop(crop_id=crop_id, block_id=block_id)

