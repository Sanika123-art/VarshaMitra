"""Text-to-speech (TTS) streaming service for authentic Marathi and English agricultural advisories."""

import re
from typing import List
from fastapi import APIRouter, HTTPException, Query, Response
import httpx
from app.core.logging import logger

router = APIRouter(prefix="/tts", tags=["Voice & TTS"])

# In-memory cache to save bandwidth and deliver sub-millisecond voice responses
_AUDIO_CACHE: dict[str, bytes] = {}
_MAX_CACHE_ENTRIES = 200


def _split_into_chunks(text: str, max_chars: int = 180) -> List[str]:
    """Split text into sentence-level chunks suitable for TTS synthesis."""
    # Clean markdown and formatting symbols
    cleaned = re.sub(r"[\*#_`~\[\]\(\)]", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if len(cleaned) <= max_chars:
        return [cleaned] if cleaned else []

    # Split by Marathi / Hindi danda (।), period, newline, or semicolon
    sentences = re.split(r"(?<=[।.\n;?!])\s+", cleaned)
    chunks = []
    current_chunk = ""

    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(current_chunk) + len(s) + 1 <= max_chars:
            current_chunk = f"{current_chunk} {s}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(s) > max_chars:
                words = s.split(" ")
                sub_chunk = ""
                for w in words:
                    if len(sub_chunk) + len(w) + 1 <= max_chars:
                        sub_chunk = f"{sub_chunk} {w}".strip()
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = w
                if sub_chunk:
                    chunks.append(sub_chunk)
                current_chunk = ""
            else:
                current_chunk = s

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


@router.get("", summary="Stream authentic Google Assistant Marathi or English speech audio")
async def stream_tts(
    text: str = Query(..., min_length=1, max_length=2000, description="Text to synthesize into speech"),
    lang: str = Query("mr", description="Language code: 'mr' for Marathi, 'en' for English"),
) -> Response:
    """Streams natural Marathi Google Assistant female voice audio MP3 for rural IVRS or farmer accessibility."""
    target_lang = "mr" if lang.startswith("mr") else "en"
    cache_key = f"{target_lang}::{text}"

    if cache_key in _AUDIO_CACHE:
        return Response(
            content=_AUDIO_CACHE[cache_key],
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=86400"},
        )

    chunks = _split_into_chunks(text, max_chars=180)
    if not chunks:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_bytes_list: List[bytes] = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for chunk in chunks:
                headers = {
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    )
                }
                params = {
                    "ie": "UTF-8",
                    "tl": target_lang,
                    "client": "tw-ob",
                    "q": chunk,
                }
                res = await client.get(
                    "https://translate.google.com/translate_tts",
                    params=params,
                    headers=headers,
                )
                if res.status_code == 200 and len(res.content) > 0:
                    audio_bytes_list.append(res.content)
                else:
                    logger.warning(f"TTS fetch returned status {res.status_code} for chunk: {chunk[:30]}")

    except Exception as exc:
        logger.error(f"Error fetching TTS audio stream: {exc}")
        raise HTTPException(status_code=502, detail=f"Failed to synthesize voice stream: {exc}")

    if not audio_bytes_list:
        raise HTTPException(status_code=500, detail="Could not generate voice audio.")

    combined_mp3 = b"".join(audio_bytes_list)

    if len(_AUDIO_CACHE) < _MAX_CACHE_ENTRIES:
        _AUDIO_CACHE[cache_key] = combined_mp3

    return Response(
        content=combined_mp3,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": 'inline; filename="advisory.mp3"',
        },
    )

