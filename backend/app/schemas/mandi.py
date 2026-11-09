"""Pydantic schemas for APMC Mandi rates and Agmarknet feeds."""

from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class NearbyMandiItem(BaseModel):
    """Price row for one official market or an explicitly labeled demo sample."""
    model_config = ConfigDict(extra="ignore")

    market_id: str = Field(..., description="Unique market slug")
    market_name: str = Field(..., description="Market name in English")
    market_name_mr: str = Field(..., description="Market name in Marathi")
    variety: Optional[str] = Field(None, description="Commodity variety as reported by the market")
    distance_km: Optional[float] = Field(None, description="Distance, only when verified market coordinates exist")
    distance_km_str: Optional[str] = Field(None, description="Distance text, only when verified")
    is_nearest: bool = Field(default=False, description="True if this is the default closest mandi")
    modal_price: float = Field(..., description="Modal rate in INR per unit")
    min_price: float = Field(..., description="Min auction price in INR")
    max_price: float = Field(..., description="Max auction price in INR")
    arrivals: Optional[str] = Field(None, description="Daily arrival volume in English")
    arrivals_mr: Optional[str] = Field(None, description="Daily arrival volume in Marathi")
    trend: str = Field(default="stable", description="up | down | stable")
    trend_mr: str = Field(default="स्थिर", description="Trend description in Marathi")
    selling_advice_en: Optional[str] = Field(None, description="Selling advice in English")
    selling_advice_mr: Optional[str] = Field(None, description="Selling advice in Marathi")


class MandiRateResponse(BaseModel):
    """Official market records or clearly identified demo prices for a district."""
    model_config = ConfigDict(extra="ignore")

    crop_id: str = Field(..., description="Crop identifier, e.g. onion, soybean, cotton")
    crop_name: str = Field(..., description="Crop name in English")
    crop_name_mr: str = Field(..., description="Crop name in Marathi")
    market_name: Optional[str] = Field(None, description="Market name from the official record")
    market_name_mr: Optional[str] = Field(None, description="Market name in Marathi when available")
    district: str = Field(..., description="District name")
    district_mr: str = Field(..., description="District name in Marathi")
    taluka: Optional[str] = Field(None, description="Taluka/Block name")
    modal_price: Optional[float] = Field(None, description="Modal rate in INR")
    min_price: Optional[float] = Field(None, description="Minimum rate in INR")
    max_price: Optional[float] = Field(None, description="Maximum rate in INR")
    msp: Optional[float] = Field(None, description="Government Minimum Support Price (MSP) if applicable")
    msp_difference: Optional[float] = Field(None, description="Difference between modal rate and MSP")
    unit: str = Field(default="Quintal", description="Trading unit in English")
    unit_mr: str = Field(default="क्विंटल", description="Trading unit in Marathi")
    arrivals: Optional[str] = Field(None, description="Daily volume/arrivals string in English")
    arrivals_mr: Optional[str] = Field(None, description="Daily volume/arrivals string in Marathi")
    trend: str = Field(default="stable", description="Market demand trend: up | down | stable")
    trend_mr: str = Field(default="स्थिर", description="Trend description in Marathi")
    arrival_date: Optional[str] = Field(None, description="Official arrival date from source (YYYY-MM-DD)")
    sync_time: Optional[str] = Field(None, description="Time of last successful source synchronization")
    source: str = Field(default="Data.gov.in (Agmarknet)", description="Data provider citation")
    source_url: str = Field(default="https://agmarknet.gov.in", description="Official portal link")
    data_mode: Literal["official", "demo", "unavailable"] = Field(
        default="unavailable",
        description="Whether prices are official live records, illustrative demo values, or unavailable",
    )
    is_live_sync: bool = Field(default=False, description="True only after receiving official source records")
    data_available: bool = Field(default=False, description="True when a price display is present; check data_mode to identify demo values")
    availability_code: Optional[str] = Field(None, description="Machine-readable reason verified prices are unavailable")
    availability_notice: Optional[str] = Field(None, description="Reason verified rates are unavailable")
    selling_advice_en: Optional[str] = Field(None, description="Non-price-specific selling guidance")
    selling_advice_mr: Optional[str] = Field(None, description="Non-price-specific selling guidance")
    nearby_mandis: List[NearbyMandiItem] = Field(default_factory=list, description="Price rows for the selected district; distances are not inferred")
