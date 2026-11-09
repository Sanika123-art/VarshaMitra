"""Farmer feedback and community routes."""

import sqlite3

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.community import FarmerFeedbackCreate, FarmerFeedbackList, FarmerFeedbackPost
from app.services.community_feedback import create_feedback, list_feedback

router = APIRouter(prefix="/community", tags=["Farmer Community"])


@router.get(
    "/feedback",
    response_model=FarmerFeedbackList,
    summary="List farmer feedback",
)
async def get_feedback(
    limit: int = Query(default=100, ge=1, le=100),
) -> FarmerFeedbackList:
    try:
        return list_feedback(limit)
    except sqlite3.Error as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Farmer feedback is temporarily unavailable.",
        ) from error


@router.post(
    "/feedback",
    response_model=FarmerFeedbackPost,
    status_code=status.HTTP_201_CREATED,
    summary="Post farmer feedback",
)
async def post_feedback(payload: FarmerFeedbackCreate) -> FarmerFeedbackPost:
    try:
        return create_feedback(payload)
    except sqlite3.Error as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Your feedback could not be saved. Please try again.",
        ) from error
