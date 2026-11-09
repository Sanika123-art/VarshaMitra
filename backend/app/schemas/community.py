"""Schemas for farmer-submitted community feedback."""

import re
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

FeedbackRating = Literal["helpful", "slightly_high", "slightly_low", "not_sure", "suggestion"]


class FarmerFeedbackCreate(BaseModel):
    """Public feedback content; contact numbers are deliberately not collected."""

    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=40)
    district: str = Field(..., min_length=2, max_length=60)
    taluka: str | None = Field(default=None, max_length=60)
    rating: FeedbackRating
    message: str = Field(..., min_length=10, max_length=500)

    @field_validator("display_name", "district", "taluka", "message")
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned and value:
            raise ValueError("This field cannot contain only spaces.")
        return cleaned

    @field_validator("message")
    @classmethod
    def reject_phone_numbers(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if any(
            digits[index] in "6789"
            for index in range(max(0, len(digits) - 9))
            if len(digits[index:index + 10]) == 10
        ):
            raise ValueError("Please remove mobile numbers before posting.")
        return value


class FarmerFeedbackPost(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    display_name: str
    district: str
    taluka: str | None = None
    rating: FeedbackRating
    message: str
    created_at: datetime


class FarmerFeedbackList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FarmerFeedbackPost]
