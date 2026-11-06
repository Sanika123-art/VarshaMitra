"""Chat router for Saarthi AI Farming Companion."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.chat import (
    ChatConversationCreate,
    ChatConversationDetailResponse,
    ChatConversationResponse,
    ChatConversationUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Saarthi Chatbot"])


@router.post(
    "/conversations",
    response_model=ChatConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Saarthi conversation session",
)
def create_conversation(payload: ChatConversationCreate) -> ChatConversationResponse:
    """Initialize and persist a new conversation session."""
    return chat_service.create_conversation(
        location_id=payload.location_id,
        crop_id=payload.crop_id,
        stage_id=payload.stage_id,
        language=payload.language,
        title=payload.title,
    )


@router.get(
    "/conversations",
    response_model=List[ChatConversationResponse],
    summary="List all persisted Saarthi conversations",
)
def list_conversations() -> List[ChatConversationResponse]:
    """Retrieve all conversations ordered by recent activity."""
    return chat_service.list_conversations()


@router.get(
    "/conversations/{conversation_id}",
    response_model=ChatConversationDetailResponse,
    summary="Get conversation detail with complete message history",
)
def get_conversation(conversation_id: str) -> ChatConversationDetailResponse:
    """Retrieve full conversation messages."""
    conv = chat_service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found.",
        )
    return conv


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageResponse,
    summary="Send a user message to Saarthi and receive context-aware response",
)
def send_message(
    conversation_id: str,
    payload: ChatMessageCreate,
    location_id: Optional[str] = Query(None, description="Active farm location"),
    crop_id: Optional[str] = Query(None, description="Active farm crop"),
    stage_id: Optional[str] = Query(None, description="Active crop stage"),
    language: Optional[str] = Query("en", description="Preferred response language"),
) -> ChatMessageResponse:
    """Process a user question, consult active agronomic facts, and return response."""
    try:
        return chat_service.send_message(
            conversation_id=conversation_id,
            user_content=payload.content,
            current_location_id=location_id,
            current_crop_id=crop_id,
            current_stage_id=stage_id,
            language=language,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Saarthi chat processing failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Saarthi response.",
        )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=dict,
    summary="Rename a conversation session",
)
def update_conversation(
    conversation_id: str, payload: ChatConversationUpdate
) -> dict:
    """Update title of an existing conversation."""
    updated = chat_service.update_conversation_title(conversation_id, payload.title)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found.",
        )
    return {"status": "ok", "message": "Conversation updated"}


@router.delete(
    "/conversations/{conversation_id}",
    response_model=dict,
    summary="Delete an individual conversation session",
)
def delete_conversation(conversation_id: str) -> dict:
    """Delete a conversation and all its messages."""
    deleted = chat_service.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found.",
        )
    return {"status": "ok", "message": "Conversation deleted"}


@router.delete(
    "/conversations",
    response_model=dict,
    summary="Clear all conversation history",
)
def clear_all_conversations() -> dict:
    """Delete all conversations and history."""
    count = chat_service.clear_all_conversations()
    return {"status": "ok", "cleared_conversations_count": count}

