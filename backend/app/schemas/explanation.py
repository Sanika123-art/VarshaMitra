"""Pydantic schemas for NuGen LLM explanations and guardrail validation."""

from datetime import datetime as dt_datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ExplanationProviderStatus(str, Enum):
    """Operational status of the explanation generation provider."""
    GENERATED = "generated"      # Successfully produced by NuGen LLM and validated against invariants
    FALLBACK = "fallback"        # Derived from authoritative deterministic fallback templates
    DISABLED = "disabled"        # NuGen integration is explicitly disabled in settings
    UNAVAILABLE = "unavailable"  # NuGen API timed out, returned error, or credentials missing


class ExplanationRequest(BaseModel):
    """Client request for generating an advisory explanation.
    
    All agronomic decisions and risk data are resolved strictly server-side
    to prevent client-side injection or manipulation of facts.
    """
    model_config = ConfigDict(extra="forbid")

    language: str = Field(default="en", description="Explanation language: 'en' for English, 'mr' for Marathi")
    focus_topic: Optional[str] = Field(default=None, description="Optional area of focus: climate | soil | action | general")


class ExplanationResponse(BaseModel):
    """Grounded, evidence-validated agricultural explanation response."""
    model_config = ConfigDict(extra="forbid")

    advisory_id: str = Field(..., description="Canonical advisory reference ID")
    location_id: str = Field(..., description="Administrative block ID")
    block_name: str = Field(..., description="Block name")
    district_name: str = Field(..., description="District name")
    crop_id: str = Field(..., description="Evaluated crop identifier")
    crop_name: str = Field(..., description="Crop name in target language")
    stage_id: str = Field(..., description="Crop growth stage ID")
    stage_name: str = Field(..., description="Growth stage name in target language")
    language: str = Field(..., description="Language of explanation: en | mr")
    provider_status: ExplanationProviderStatus = Field(
        ...,
        description="Origin of explanation: generated | fallback | disabled | unavailable"
    )
    model_used: Optional[str] = Field(None, description="LLM model identifier used if generated, else null")
    
    # Grounded narrative sections
    summary: str = Field(..., description="Concise explanation of the validated result")
    signal_explanation: str = Field(..., description="What the underlying weather and soil indicators mean for this crop")
    reasoning_summary: str = Field(..., description="Plain-language explanation of the agronomic rationale")
    action_explanation: str = Field(..., description="Clear explanation of the approved primary field action")
    uncertainty: str = Field(..., description="Data gaps, forecast horizons, and what the farmer should verify")
    
    # Protected canonical anchors (strictly immutated from server-side record)
    canonical_primary_action: str = Field(..., description="Original authoritative action from Phase 4 advisory")
    canonical_priority: str = Field(..., description="Official priority tier: critical | warning | advisory | info")
    rule_id: str = Field(..., description="Agronomic rule identifier")
    rule_version: str = Field(..., description="Ruleset version")
    provenance: str = Field(..., description="Institutional source citation")
    generated_at: dt_datetime = Field(..., description="UTC timestamp of generation")
    limitations: str = Field(
        default=(
            "Explanations are decision-support clarifications grounded strictly in validated VarshaMitra records. "
            "They do not replace statutory disaster alerts or field verification with local Krishi Vigyan Kendra (KVK) officers."
        ),
        description="Disclaimer on AI explanation boundary"
    )
