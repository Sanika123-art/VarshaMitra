"""Schemas for Saarthi AI Conversational Assistant with persistent backend storage."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="User question or message text")


class ChatMessageResponse(BaseModel):
    id: str = Field(..., description="Unique message identifier")
    conversation_id: str = Field(..., description="Parent conversation identifier")
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text content")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    provider_status: Optional[str] = Field(default="nugen", description="'nugen', 'engine_fallback', or 'error'")
    context_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Agronomic snapshot metadata")


class ChatConversationCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120, description="Conversation title")
    location_id: Optional[str] = Field(default=None, description="Active block/location identifier")
    crop_id: Optional[str] = Field(default=None, description="Active crop identifier")
    stage_id: Optional[str] = Field(default=None, description="Active crop growth stage")
    language: str = Field(default="en", description="Language: 'en' or 'mr'")


class ChatConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, description="Updated conversation title")


class ChatConversationResponse(BaseModel):
    id: str = Field(..., description="Unique conversation identifier")
    title: str = Field(..., description="Conversation title")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 update timestamp")
    location_id: Optional[str] = Field(default=None, description="Associated location identifier")
    crop_id: Optional[str] = Field(default=None, description="Associated crop identifier")
    stage_id: Optional[str] = Field(default=None, description="Associated growth stage")
    language: str = Field(default="en", description="Language: 'en' or 'mr'")
    latest_message: Optional[str] = Field(default=None, description="Preview of most recent message")
    message_count: int = Field(default=0, description="Total messages in conversation")


class ChatConversationDetailResponse(ChatConversationResponse):
    messages: List[ChatMessageResponse] = Field(default_factory=list, description="All messages in conversation")
