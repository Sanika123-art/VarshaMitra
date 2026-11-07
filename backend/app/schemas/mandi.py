"""Pydantic schemas for APMC Mandi rates and Agmarknet feeds."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NearbyMandiItem(BaseModel):
    """Detailed market rate item for a nearby APMC Mandi."""
    model_config = ConfigDict(extra="ignore")

    market_id: str = Field(..., description="Unique market slug")
    market_name: str = Field(..., description="Market name in English")
    market_name_mr: str = Field(..., description="Market name in Marathi")
    distance_km: float = Field(..., description="Approximate road distance from farmer's taluka in km")
    distance_km_str: str = Field(..., description="Localized distance string")
    is_nearest: bool = Field(default=False, description="True if this is the default closest mandi")
    modal_price: float = Field(..., description="Modal rate in INR per unit")
    min_price: float = Field(..., description="Min auction price in INR")
    max_price: float = Field(..., description="Max auction price in INR")
    arrivals: str = Field(..., description="Daily arrival volume in English")
    arrivals_mr: str = Field(..., description="Daily arrival volume in Marathi")
    trend: str = Field(default="stable", description="up | down | stable")
    trend_mr: str = Field(default="स्थिर", description="Trend description in Marathi")
    selling_advice_en: Optional[str] = Field(None, description="Selling advice in English")
    selling_advice_mr: Optional[str] = Field(None, description="Selling advice in Marathi")


class MandiRateResponse(BaseModel):
    """Real-time APMC Mandi market rates data payload with multi-mandi comparison."""
    model_config = ConfigDict(extra="ignore")

    crop_id: str = Field(..., description="Crop identifier, e.g. onion, soybean, cotton")
    crop_name: str = Field(..., description="Crop name in English")
    crop_name_mr: str = Field(..., description="Crop name in Marathi")
    market_name: str = Field(..., description="Official default APMC Mandi name in English")
    market_name_mr: str = Field(..., description="Official default APMC Mandi name in Marathi")
    district: str = Field(..., description="District name")
    district_mr: str = Field(..., description="District name in Marathi")
    taluka: Optional[str] = Field(None, description="Taluka/Block name")
    modal_price: float = Field(..., description="Modal (average auction) rate in INR")
    min_price: float = Field(..., description="Minimum auction price in INR")
    max_price: float = Field(..., description="Maximum auction price in INR")
    msp: Optional[float] = Field(None, description="Government Minimum Support Price (MSP) if applicable")
    msp_difference: Optional[float] = Field(None, description="Difference between modal rate and MSP")
    unit: str = Field(default="Quintal", description="Trading unit in English")
    unit_mr: str = Field(default="क्विंटल", description="Trading unit in Marathi")
    arrivals: str = Field(..., description="Daily volume/arrivals string in English")
    arrivals_mr: str = Field(..., description="Daily volume/arrivals string in Marathi")
    trend: str = Field(default="stable", description="Market demand trend: up | down | stable")
    trend_mr: str = Field(default="स्थिर", description="Trend description in Marathi")
    arrival_date: str = Field(..., description="Official auction date (YYYY-MM-DD)")
    sync_time: str = Field(..., description="Auction bulletin session timestamp (e.g. 11:00 AM)")
    source: str = Field(default="MSAMB & Data.gov.in (Agmarknet)", description="Data provider citation")
    source_url: str = Field(default="https://agmarknet.gov.in", description="Official portal link")
    is_live_sync: bool = Field(default=True, description="True if synchronized with official daily Agmarknet bulletin")
    selling_advice_en: str = Field(..., description="Commercial marketing guidance for farmers in English")
    selling_advice_mr: str = Field(..., description="Commercial marketing guidance for farmers in Marathi")
    nearby_mandis: List[NearbyMandiItem] = Field(default_factory=list, description="2-3 nearby alternative APMC markets for price comparison")
