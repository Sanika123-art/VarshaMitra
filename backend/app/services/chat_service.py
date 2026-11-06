"""Saarthi Conversational Assistant Service with persistent backend storage and NuGen intelligence.

Stores all conversation history and individual messages in the central SQLite database.
Gathers real-time agricultural and climate context (block details, weather forecast,
sowing assessment, crop advisories, soil characteristics) to provide grounded,
truthful answers in English and Marathi without hallucinating chemical dosages.
"""

import contextlib
from datetime import datetime, timezone
import json
import logging
import sqlite3
import uuid
from typing import Any, Dict, Iterator, List, Optional, Tuple

from app.core.config import settings
from app.schemas.chat import (
    ChatConversationDetailResponse,
    ChatConversationResponse,
    ChatMessageResponse,
)
from app.services.agronomy.advisory_engine import generate_crop_advisories
from app.services.agronomy.crop_service import crop_service
from app.services.agronomy.soil_service import soil_service
from app.services.agronomy.sowing_engine import evaluate_sowing_readiness
from app.services.dataset.storage import dataset_storage
from app.services.explanation.nugen_client import (
    NuGenClient,
    NuGenClientError,
    nugen_client,
)
from app.services.location_service import location_service
from app.services.rainfall.open_meteo import OpenMeteoRainfallProvider

logger = logging.getLogger(__name__)


class ChatService:
    """Manages persistent chat conversations and context-aware Saarthi assistant responses."""

    def __init__(self, client: Optional[NuGenClient] = None):
        self.client = client or nugen_client
        self._weather_provider = OpenMeteoRainfallProvider()
        self._init_db()

    @contextlib.contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(dataset_storage.db_path)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Create conversations and messages tables if they do not exist."""
        try:
            with self._connection() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS chat_conversations (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        location_id TEXT,
                        crop_id TEXT,
                        stage_id TEXT,
                        language TEXT NOT NULL DEFAULT 'en'
                    );
                    """
                )
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        provider_status TEXT DEFAULT 'nugen',
                        context_metadata_json TEXT,
                        FOREIGN KEY(conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    );
                    """
                )
                conn.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_chat_messages_conv 
                    ON chat_messages(conversation_id, created_at);
                    """
                )
        except sqlite3.Error as exc:
            logger.error("Failed to initialize chat database tables: %s", exc)

    def create_conversation(
        self,
        location_id: Optional[str] = None,
        crop_id: Optional[str] = None,
        stage_id: Optional[str] = None,
        language: str = "en",
        title: Optional[str] = None,
    ) -> ChatConversationResponse:
        """Create a new conversation session and persist it."""
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine initial title based on context
        loc_name = ""
        if location_id:
            loc = location_service.get_block(location_id)
            if loc:
                loc_name = loc.name
        
        crop_name = ""
        if crop_id:
            c = crop_service.get_crop(crop_id)
            if c:
                crop_name = c.name

        if not title:
            if loc_name and crop_name:
                title = f"{crop_name} in {loc_name}"
            elif loc_name:
                title = f"Farm Query — {loc_name}"
            else:
                title = "New Consultation"

        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO chat_conversations (id, title, created_at, updated_at, location_id, crop_id, stage_id, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (conv_id, title, now, now, location_id, crop_id, stage_id, language),
            )

        return ChatConversationResponse(
            id=conv_id,
            title=title,
            created_at=now,
            updated_at=now,
            location_id=location_id,
            crop_id=crop_id,
            stage_id=stage_id,
            language=language,
            latest_message=None,
            message_count=0,
        )

    def list_conversations(self) -> List[ChatConversationResponse]:
        """List all conversation sessions ordered by most recently updated."""
        with self._connection() as conn:
            rows = conn.execute(
                """
                SELECT 
                    c.id, c.title, c.created_at, c.updated_at, c.location_id, c.crop_id, c.stage_id, c.language,
                    (SELECT content FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as latest_message,
                    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count
                FROM chat_conversations c
                ORDER BY c.updated_at DESC
                """
            ).fetchall()

        return [
            ChatConversationResponse(
                id=r["id"],
                title=r["title"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                location_id=r["location_id"],
                crop_id=r["crop_id"],
                stage_id=r["stage_id"],
                language=r["language"],
                latest_message=r["latest_message"],
                message_count=r["message_count"],
            )
            for r in rows
        ]

    def get_conversation(self, conversation_id: str) -> Optional[ChatConversationDetailResponse]:
        """Retrieve a conversation along with its full message history."""
        with self._connection() as conn:
            conv_row = conn.execute(
                """
                SELECT id, title, created_at, updated_at, location_id, crop_id, stage_id, language
                FROM chat_conversations WHERE id = ?
                """,
                (conversation_id,),
            ).fetchone()

            if not conv_row:
                return None

            msg_rows = conn.execute(
                """
                SELECT id, conversation_id, role, content, created_at, provider_status, context_metadata_json
                FROM chat_messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                """,
                (conversation_id,),
            ).fetchall()

        messages = [
            ChatMessageResponse(
                id=m["id"],
                conversation_id=m["conversation_id"],
                role=m["role"],
                content=m["content"],
                created_at=m["created_at"],
                provider_status=m["provider_status"],
                context_metadata=json.loads(m["context_metadata_json"]) if m["context_metadata_json"] else None,
            )
            for m in msg_rows
        ]

        latest = messages[-1].content if messages else None

        return ChatConversationDetailResponse(
            id=conv_row["id"],
            title=conv_row["title"],
            created_at=conv_row["created_at"],
            updated_at=conv_row["updated_at"],
            location_id=conv_row["location_id"],
            crop_id=conv_row["crop_id"],
            stage_id=conv_row["stage_id"],
            language=conv_row["language"],
            latest_message=latest,
            message_count=len(messages),
            messages=messages,
        )

    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title."""
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            cur = conn.execute(
                "UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ?",
                (title, now, conversation_id),
            )
            return cur.rowcount > 0

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete an individual conversation and all associated messages."""
        with self._connection() as conn:
            conn.execute("DELETE FROM chat_messages WHERE conversation_id = ?", (conversation_id,))
            cur = conn.execute("DELETE FROM chat_conversations WHERE id = ?", (conversation_id,))
            return cur.rowcount > 0

    def clear_all_conversations(self) -> int:
        """Clear all conversation history."""
        with self._connection() as conn:
            conn.execute("DELETE FROM chat_messages")
            cur = conn.execute("DELETE FROM chat_conversations")
            return cur.rowcount

    def _gather_agronomic_context(
        self, location_id: Optional[str], crop_id: Optional[str], stage_id: Optional[str], language: str
    ) -> Dict[str, Any]:
        """Retrieve real backend values for location, weather, soil, and agronomy."""
        loc_id = location_id or "baramati"
        cr_id = crop_id or "soybean"
        st_id = stage_id or "sowing"

        block = location_service.get_block(loc_id)
        block_name = block.name if block else loc_id.title()
        district_name = block.district_name if block else "Maharashtra"

        # 1. Weather forecast
        forecast_total_mm = 0.0
        today_rain_mm = 0.0
        try:
            if block:
                fc = self._weather_provider.fetch_forecast(block.latitude, block.longitude, days=14)
                forecast_total_mm = round(sum(f.precipitation_sum_mm or 0.0 for f in fc), 1)
                today_rain_mm = fc[0].precipitation_sum_mm if fc else 0.0
        except Exception as e:
            logger.warning("Saarthi context weather lookup failed: %s", e)

        # 2. Sowing readiness
        sowing_status = "unavailable"
        sowing_summary = ""
        antecedent_rain_14d = 0.0
        try:
            sow_res = evaluate_sowing_readiness(loc_id, cr_id)
            sowing_status = sow_res.status.value
            sowing_summary = (
                sow_res.sowing_readiness_summary_mr if language == "mr" else sow_res.sowing_readiness_summary_en
            )
            antecedent_rain_14d = sow_res.antecedent_rainfall_14d_mm
        except Exception as e:
            logger.warning("Saarthi context sowing lookup failed: %s", e)

        # 3. Crop advisory
        advisory_action = ""
        advisory_reason = ""
        advisory_caveat = ""
        try:
            adv_res = generate_crop_advisories(loc_id, cr_id, st_id, language=language)
            advisory_action = (
                adv_res.primary_advisory.primary_action_mr if language == "mr" else adv_res.primary_advisory.primary_action_en
            )
            advisory_reason = (
                adv_res.primary_advisory.plain_language_reason_mr if language == "mr" else adv_res.primary_advisory.plain_language_reason_en
            )
            advisory_caveat = adv_res.primary_advisory.caveats
        except Exception as e:
            logger.warning("Saarthi context advisory lookup failed: %s", e)

        # 4. Soil
        soil_texture = ""
        try:
            soil = soil_service.get_regional_profile(loc_id)
            if soil:
                soil_texture = soil.dominant_texture.replace("_", " ")
        except Exception as e:
            logger.warning("Saarthi context soil lookup failed: %s", e)

        return {
            "location_name": block_name,
            "district_name": district_name,
            "crop_name": cr_id.title(),
            "stage_name": st_id.replace("_", " ").title(),
            "today_rain_mm": today_rain_mm,
            "forecast_14d_mm": forecast_total_mm,
            "antecedent_14d_mm": antecedent_rain_14d,
            "sowing_status": sowing_status,
            "sowing_summary": sowing_summary,
            "advisory_action": advisory_action,
            "advisory_reason": advisory_reason,
            "advisory_caveat": advisory_caveat,
            "soil_texture": soil_texture,
        }

    def _generate_engine_fallback_response(
        self, user_question: str, context: Dict[str, Any], language: str
    ) -> str:
        """Deterministic, grounded fallback when NuGen LLM is unconfigured or unreachable."""
        q_lower = user_question.lower()
        is_mr = language == "mr"
        loc = context["location_name"]
        cr = context["crop_name"]
        st = context["stage_name"]
        today_rain = context["today_rain_mm"]
        fc_14d = context["forecast_14d_mm"]
        past_14d = context["antecedent_14d_mm"]
        sowing_sum = context["sowing_summary"]
        adv_action = context["advisory_action"]
        adv_reason = context["advisory_reason"]
        caveat = context["advisory_caveat"]

        # Weather questions
        if any(w in q_lower for w in ["rain", "weather", "forecast", "हवामान", "पाऊस"]):
            if is_mr:
                return (
                    f"**{loc} परिसराचा हवामान अंदाज:**\n\n"
                    f"• आजचा अपेक्षित पाऊस: **{today_rain} मिमी**\n"
                    f"• पुढील १४ दिवसांतील एकूण अपेक्षित पाऊस: **{fc_14d} मिमी**\n"
                    f"• मागील १४ दिवसांतील पडलेला पाऊस: **{past_14d} मिमी**\n\n"
                    f"{'पुढील दिवसांत हवामान कोरडे राहण्याची शक्यता आहे. शेतीची पूर्वमशागत किंवा आंतरमशागत पूर्ण करण्यासाठी वेळ अनुकूल आहे.' if fc_14d < 10 else 'पुढील दिवसांत पावसाची शक्यता आहे. पाणी साचू नये म्हणून निचरा व्यवस्था तपासावी.'}\n\n"
                    f"*(माहिती स्रोत: Open-Meteo डिटरमिनिस्टिक हवामान मॉडेल)*"
                )
            return (
                f"**Weather Outlook for {loc}, {context['district_name']}:**\n\n"
                f"• Today's Expected Rain: **{today_rain} mm**\n"
                f"• Total Rain Forecast (Next 14 Days): **{fc_14d} mm**\n"
                f"• Past 14-Day Accumulated Rain: **{past_14d} mm**\n\n"
                f"{'Conditions are largely dry over the coming days, which is favorable for field cultivation, weeding, or post-harvest operations.' if fc_14d < 10 else 'Showers are expected in the upcoming period. Please verify that field drainage channels are clear.'}\n\n"
                f"*(Source: Open-Meteo Deterministic Forecast)*"
            )

        # Sowing questions
        if any(w in q_lower for w in ["sow", "sowing", "plant", "पेरणी", "लागवड"]):
            if is_mr:
                return (
                    f"**{loc} येथे {cr} पेरणी सल्ला:**\n\n"
                    f"{sowing_sum}\n\n"
                    f"• मागील १४ दिवसांतील पाऊस: **{past_14d} मिमी** (किमान ७५ मिमी आवश्यक)\n"
                    f"• पुढील १४ दिवसांचा अंदाज: **{fc_14d} मिमी**\n\n"
                    f"**महत्त्वाचा नियम:** जमिनीत योग्य वाफसा स्थिती (१० सेमी खोलीवर पुरेसा ओलावा) असल्याशिवाय कोरड्या जमिनीत पेरणी करू नये.\n\n"
                    f"*(संदर्भ: म.फु.कृ.वि. राहुरी खरीप पीक उत्पादन मार्गदर्शक पुस्तिका)*"
                )
            return (
                f"**Sowing Assessment for {cr} in {loc}:**\n\n"
                f"{sowing_sum}\n\n"
                f"• Rainfall in last 14 days: **{past_14d} mm** (75 mm antecedent rain required for safe germination)\n"
                f"• Forward 14-day forecast: **{fc_14d} mm**\n\n"
                f"**Key Agronomic Rule:** Sowing into dry soil without verified Vapsa (proper topsoil moisture to 10 cm depth) risks poor seedling emergence.\n\n"
                f"*(Source: MPKV Rahuri Kharif Crop Production Guide)*"
            )

        # General action / advisory questions
        if is_mr:
            return (
                f"**{loc} येथील {cr} ({st}) साठी आजचा कृषी सल्ला:**\n\n"
                f"**काय करावे:**\n{adv_action or 'पिकाचे नियमित निरीक्षण करावे आणि शेताचे बांध स्वच्छ ठेवावेत.'}\n\n"
                f"**कृषी कारण:**\n{adv_reason or 'हवामान आणि वाढीच्या टप्प्यानुसार ही कृती सुचवली आहे.'}\n\n"
                f"{f'**काय टाळावे:** {caveat}' if caveat else ''}\n\n"
                f"*(मार्गदर्शन: वसंतराव नाईक मराठवाडा कृषी विद्यापीठ / म.फु.कृ.वि. राहुरी शिफारसी)*"
            )
        return (
            f"**Recommended Agronomic Action for {cr} ({st}) in {loc}:**\n\n"
            f"**What You Should Do:**\n{adv_action or 'Continue routine field monitoring and maintain weed-free borders.'}\n\n"
            f"**Agronomic Reason:**\n{adv_reason or 'Tailored to the current growth stage and local moisture conditions.'}\n\n"
            f"{f'**What to Avoid:** {caveat}' if caveat else ''}\n\n"
            f"*(Guidance based on MPKV Rahuri & PDKV Akola package of practices)*"
        )

    def send_message(
        self,
        conversation_id: str,
        user_content: str,
        current_location_id: Optional[str] = None,
        current_crop_id: Optional[str] = None,
        current_stage_id: Optional[str] = None,
        language: Optional[str] = None,
    ) -> ChatMessageResponse:
        """Process user message, generate context-aware response, and persist both."""
        now = datetime.now(timezone.utc).isoformat()
        user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"

        # 1. Fetch conversation
        conv = self.get_conversation(conversation_id)
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found.")

        # Update session context if farmer switched selections
        loc_id = current_location_id or conv.location_id or "baramati"
        cr_id = current_crop_id or conv.crop_id or "soybean"
        st_id = current_stage_id or conv.stage_id or "sowing"
        lang = language or conv.language or "en"

        # 2. Persist user message
        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO chat_messages (id, conversation_id, role, content, created_at, provider_status)
                VALUES (?, ?, 'user', ?, ?, 'user')
                """,
                (user_msg_id, conversation_id, user_content, now),
            )

        # 3. Gather real agronomic context
        context = self._gather_agronomic_context(loc_id, cr_id, st_id, lang)

        # 4. Generate assistant response
        provider_status = "engine_fallback"
        assistant_content = ""

        if self.client.is_configured:
            try:
                system_prompt = (
                    "You are Saarthi, a trusted, respectful Indian agricultural AI companion for Maharashtra farmers. "
                    "You communicate simply and clearly in the requested language. "
                    "CRITICAL NON-NEGOTIABLE SAFETY RULES:\n"
                    "1. Never invent arbitrary chemical pesticide or fertilizer dosages.\n"
                    "2. Use only the provided real-time agronomic and weather facts.\n"
                    "3. Ground all sowing advice in the verified antecedent moisture.\n"
                    "4. If information is missing or uncertain, communicate that honestly.\n\n"
                    f"ACTIVE FARM CONTEXT:\n"
                    f"- Location: {context['location_name']}, {context['district_name']}, Maharashtra\n"
                    f"- Crop: {context['crop_name']} (Stage: {context['stage_name']})\n"
                    f"- Today's rain forecast: {context['today_rain_mm']} mm\n"
                    f"- Next 14 days rain forecast: {context['forecast_14d_mm']} mm\n"
                    f"- Past 14 days antecedent rain: {context['antecedent_14d_mm']} mm\n"
                    f"- Sowing readiness: {context['sowing_status']} ({context['sowing_summary']})\n"
                    f"- Agronomic practice: {context['advisory_action']}\n"
                    f"- Agronomic rationale: {context['advisory_reason']}\n"
                    f"- Caveats/Restrictions: {context['advisory_caveat']}\n"
                    f"- Soil texture: {context['soil_texture']}\n"
                    f"- Language: {'Marathi (मराठी)' if lang == 'mr' else 'English'}"
                )

                # Collect last 4 messages for conversational context
                history_messages = [
                    {"role": m.role, "content": m.content}
                    for m in conv.messages[-4:]
                ]
                history_messages.append({"role": "user", "content": user_content})

                messages_payload = [{"role": "system", "content": system_prompt}] + history_messages

                llm_res = self.client.generate_chat_completion(
                    messages=messages_payload,
                    temperature=0.3,
                    max_tokens=600,
                )

                choices = llm_res.get("choices", [])
                if choices and "message" in choices[0]:
                    raw_text = choices[0]["message"].get("content", "").strip()
                    if raw_text:
                        assistant_content = raw_text
                        provider_status = "nugen"
            except NuGenClientError as e:
                logger.warning("NuGen chat completion failed, falling back to agronomy engine: %s", e)
            except Exception as e:
                logger.error("Unexpected error querying NuGen: %s", e)

        if not assistant_content:
            assistant_content = self._generate_engine_fallback_response(user_content, context, lang)
            provider_status = "engine_fallback"

        # 5. Persist assistant message and update conversation
        asst_created_at = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO chat_messages (id, conversation_id, role, content, created_at, provider_status, context_metadata_json)
                VALUES (?, ?, 'assistant', ?, ?, ?, ?)
                """,
                (asst_msg_id, conversation_id, assistant_content, asst_created_at, provider_status, json.dumps(context)),
            )

            # Auto-title if first message
            new_title = conv.title
            if conv.message_count == 0 or conv.title == "New Consultation":
                # Create a concise title from the user's question
                words = user_content.strip().split()
                new_title = " ".join(words[:5])
                if len(words) > 5:
                    new_title += "..."

            conn.execute(
                """
                UPDATE chat_conversations 
                SET title = ?, updated_at = ?, location_id = ?, crop_id = ?, stage_id = ?, language = ?
                WHERE id = ?
                """,
                (new_title, asst_created_at, loc_id, cr_id, st_id, lang, conversation_id),
            )

        return ChatMessageResponse(
            id=asst_msg_id,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
            created_at=asst_created_at,
            provider_status=provider_status,
            context_metadata=context,
        )


# Singleton chat service instance
chat_service = ChatService()
