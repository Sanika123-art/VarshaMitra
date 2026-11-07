"""Central API v1 Router."""

from fastapi import APIRouter
from app.api.routes import advisories, chat, climate, crops, dataset, health, locations, mandi, rainfall, risk, soil, tts

api_v1_router = APIRouter()

# Mount health routes under v1 (/api/v1/health)
api_v1_router.include_router(health.router)

# Mount locations routes (/api/v1/locations/...)
api_v1_router.include_router(locations.router)

# Mount rainfall routes (/api/v1/rainfall/...)
api_v1_router.include_router(rainfall.router)

# Mount climate indicators routes (/api/v1/climate/...)
api_v1_router.include_router(climate.router)

# Mount risk assessment routes (/api/v1/risk/...)
api_v1_router.include_router(risk.router)

# Mount dataset inventory and ingestion routes (/api/v1/dataset/...)
api_v1_router.include_router(dataset.router)

# Mount soil intelligence routes (/api/v1/soil/...)
api_v1_router.include_router(soil.router)

# Mount crops and sowing engine routes (/api/v1/crops/...)
api_v1_router.include_router(crops.router)

# Mount crop advisories routes (/api/v1/advisories/...)
api_v1_router.include_router(advisories.router)

# Mount Saarthi conversational assistant routes (/api/v1/chat/...)
api_v1_router.include_router(chat.router)

# Mount Voice & TTS audio routes (/api/v1/tts)
api_v1_router.include_router(tts.router)

# Mount APMC Mandi rates routes (/api/v1/mandi/...)
api_v1_router.include_router(mandi.router)




