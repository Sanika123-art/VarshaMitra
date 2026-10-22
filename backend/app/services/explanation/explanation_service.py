"""Core Explanation Service and Decision-Integrity Validator for NuGen LLM.

Orchestrates server-side advisory resolution, structured prompt generation,
strict output invariant validation, and transparent deterministic fallbacks.
"""

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.schemas.agronomy import (
    AdvisoryPriority,
    CropAdvisoryResponse,
)
from app.schemas.explanation import (
    ExplanationProviderStatus,
    ExplanationResponse,
)
from app.services.agronomy.advisory_engine import generate_crop_advisories
from app.services.agronomy.crop_service import crop_service
from app.services.location_service import location_service
from app.schemas.climate import AccumulationIndicator, DrySpellIndicator, HeavyRainIndicator
from app.services.explanation.fallback_templates import generate_deterministic_explanation
from app.services.explanation.nugen_client import (
    NuGenClient,
    NuGenClientError,
    nugen_client,
)

logger = logging.getLogger(__name__)

# Disallowed phrases or unauthorized dosage patterns that would indicate hallucination
SUSPICIOUS_PATTERNS = [
    re.compile(r"\b\d+\s*(?:ml|gm|grams|kg)\s*(?:per|/)\s*(?:acre|hectare|liter|litre)\b", re.IGNORECASE),
    re.compile(r"\b(chlorpyrifos|monocrotophos|endosulfan|paraquat)\b", re.IGNORECASE),
]


class ExplanationService:
    """Service to produce grounded, verified agricultural explanations."""

    def __init__(self, client: Optional[NuGenClient] = None):
        self.client = client or nugen_client

    def validate_model_output(
        self,
        raw_output: Dict[str, Any],
        canonical_advisory: CropAdvisoryResponse,
        language: str,
    ) -> Tuple[bool, str]:
        """Validate LLM output against non-negotiable decision invariants.
        
        Rules:
        1. Required keys ('summary', 'signal_explanation', 'reasoning_summary', 'action_explanation', 'uncertainty') must exist and be non-empty strings.
        2. Must not contain hallucinated chemical dosages or prohibited toxic chemicals.
        3. Action explanation must align with the canonical primary action (must not advise the opposite, e.g. 'sow now' when canonical is 'wait').
        """
        required_keys = {"summary", "signal_explanation", "reasoning_summary", "action_explanation", "uncertainty"}
        if not all(k in raw_output and isinstance(raw_output[k], str) and raw_output[k].strip() for k in required_keys):
            return False, "Missing or non-string required output sections"

        # Check for unauthorized specific chemical dosages
        all_text = " ".join([str(raw_output[k]) for k in required_keys])
        for pattern in SUSPICIOUS_PATTERNS:
            if pattern.search(all_text):
                return False, f"Detected unverified chemical dosage or banned compound in explanation"

        # Check for semantic contradiction with canonical advice
        primary = canonical_advisory.primary_advisory
        action_text = raw_output["action_explanation"].lower()

        # If canonical is critical drainage, explanation must not recommend flood irrigation
        if "drain" in primary.primary_action_en.lower() and "flood irrigation" in action_text:
            return False, "Model contradicted canonical drainage recommendation"

        # If canonical is delay/wait sowing, explanation must not recommend immediate dry sowing
        if ("wait" in primary.primary_action_en.lower() or "do not sow" in primary.primary_action_en.lower()):
            if "sow immediately" in action_text or "dry sow" in action_text:
                return False, "Model contradicted canonical sowing delay guidance"

        return True, "Valid"

    def build_prompt_payload(
        self,
        advisory: CropAdvisoryResponse,
        language: str = "en",
    ) -> List[Dict[str, str]]:
        """Construct a minimal, evidence-grounded prompt separating system instructions from data."""
        is_mr = language.lower() == "mr"
        primary = advisory.primary_advisory
        ctx = advisory.climate_context

        target_lang = "Marathi (मराठी)" if is_mr else "English"

        system_instruction = (
            "You are VarshaMitra's Agricultural Decision Explanation Assistant for Maharashtra farmers.\n"
            "Your role is STRICTLY EXPLANATORY. You must help the farmer understand the validated agronomic result.\n"
            "CRITICAL CONSTRAINTS (VIOLATIONS WILL BE REJECTED):\n"
            "1. NEVER alter, contradict, or override the approved primary action or its priority tier.\n"
            "2. NEVER invent numbers, rainfall quantities, dates, or chemical fertilizer/pesticide dosages.\n"
            "3. NEVER prescribe high-risk chemical treatments. Direct farmers to the local Krishi Vigyan Kendra (KVK).\n"
            "4. Always remind the farmer to verify root-zone soil moisture (Vapsa condition) in their own field.\n"
            f"5. Output must be in {target_lang}.\n"
            "6. You MUST return ONLY a valid JSON object with EXACTLY these five string keys:\n"
            "   - 'summary': concise summary of the advisory\n"
            "   - 'signal_explanation': what the weather and soil conditions mean for the crop\n"
            "   - 'reasoning_summary': why this management action is recommended\n"
            "   - 'action_explanation': practical explanation of the approved action\n"
            "   - 'uncertainty': caveats, forecast limitations, and field verification steps\n"
            "Do not include any other markdown formatting or text outside the JSON."
        )

        user_content = {
            "location": f"{advisory.block_name}, {advisory.district_name}, Maharashtra",
            "crop": primary.crop_name if not is_mr else primary.crop_name_mr,
            "growth_stage": primary.stage_name if not is_mr else primary.stage_name_mr,
            "priority": primary.priority.value,
            "approved_primary_action": primary.primary_action_mr if is_mr else primary.primary_action_en,
            "agronomic_reason": primary.plain_language_reason_mr if is_mr else primary.plain_language_reason_en,
            "climate_signals": {
                "accumulation_14d_mm": ctx.get("accumulation_14d_mm"),
                "dry_spell_current_days": ctx.get("dry_spell_current_days"),
                "dry_spell_severity": ctx.get("dry_spell_severity"),
                "heavy_rain_days_count": ctx.get("heavy_rain_days_count"),
            },
            "source_citation": primary.provenance,
            "rule_id": primary.rule_id,
        }

        return [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)},
        ]

    def explain_advisory(
        self,
        advisory: CropAdvisoryResponse,
        language: str = "en",
    ) -> ExplanationResponse:
        """Generate an evidence-grounded explanation for an advisory."""
        is_mr = language.lower() == "mr"
        lang_code = "mr" if is_mr else "en"
        primary = advisory.primary_advisory

        # Check if NuGen is enabled
        if not settings.NUGEN_ENABLED:
            logger.info("NuGen provider is disabled in settings; serving deterministic fallback explanation.")
            fb = generate_deterministic_explanation(advisory, language=lang_code)
            return self._build_response(
                advisory=advisory,
                sections=fb,
                status=ExplanationProviderStatus.DISABLED,
                model_used=None,
                language=lang_code,
            )

        if not self.client.is_configured:
            logger.warning("NuGen provider enabled but API key is missing; serving deterministic fallback.")
            fb = generate_deterministic_explanation(advisory, language=lang_code)
            return self._build_response(
                advisory=advisory,
                sections=fb,
                status=ExplanationProviderStatus.UNAVAILABLE,
                model_used=None,
                language=lang_code,
            )

        # Attempt LLM generation
        try:
            messages = self.build_prompt_payload(advisory, language=lang_code)
            response_json = self.client.generate_chat_completion(messages=messages, temperature=0.2)
            
            choices = response_json.get("choices", [])
            if not choices:
                raise NuGenClientError("NuGen returned empty choices list")

            content_text = choices[0].get("message", {}).get("content", "").strip()
            
            # Parse JSON from model output
            clean_json = content_text
            if clean_json.startswith("```json"):
                clean_json = clean_json.split("```json", 1)[1].rsplit("```", 1)[0].strip()
            elif clean_json.startswith("```"):
                clean_json = clean_json.split("```", 1)[1].rsplit("```", 1)[0].strip()

            parsed_sections = json.loads(clean_json)

            # Invariant validation
            is_valid, reason = self.validate_model_output(parsed_sections, advisory, lang_code)
            if not is_valid:
                logger.warning(f"NuGen explanation rejected due to invariant check failure ({reason}). Reverting to fallback.")
                fb = generate_deterministic_explanation(advisory, language=lang_code)
                return self._build_response(
                    advisory=advisory,
                    sections=fb,
                    status=ExplanationProviderStatus.FALLBACK,
                    model_used=self.client.model,
                    language=lang_code,
                )

            # Validated successfully
            return self._build_response(
                advisory=advisory,
                sections=parsed_sections,
                status=ExplanationProviderStatus.GENERATED,
                model_used=self.client.model,
                language=lang_code,
            )

        except Exception as exc:
            logger.warning(f"NuGen explanation failed ({exc.__class__.__name__}). Reverting to fallback.")
            fb = generate_deterministic_explanation(advisory, language=lang_code)
            return self._build_response(
                advisory=advisory,
                sections=fb,
                status=ExplanationProviderStatus.UNAVAILABLE,
                model_used=self.client.model if self.client.is_configured else None,
                language=lang_code,
            )

    def explain_advisory_by_context(
        self,
        location_id: str,
        crop_id: str,
        stage_id: str,
        language: str = "en",
    ) -> ExplanationResponse:
        """Resolve canonical advisory server-side and generate explanation."""
        block = location_service.get_block(location_id)
        if not block:
            raise ValueError(f"Block '{location_id}' not found")
        crop = crop_service.get_crop(crop_id)
        if not crop:
            raise ValueError(f"Crop '{crop_id}' not found")
        stage = crop_service.get_stage(crop_id, stage_id)
        if not stage:
            raise ValueError(f"Stage '{stage_id}' not found")

        acc = AccumulationIndicator(total_mm=30.0, valid_days_count=14, missing_days_count=0, daily_average_mm=2.1)
        dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=15, max_consecutive_dry_days=15, current_consecutive_dry_days=15, severity="critical")
        heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=10.0, event_dates=[], has_heavy_rain_event=False)

        advisory = generate_crop_advisories(
            block=block,
            crop=crop,
            stage=stage,
            climate_risk=None,
            accumulation=acc,
            dry_spell=dry,
            heavy_rain=heavy,
            language=language,
        )
        return self.explain_advisory(advisory=advisory, language=language)

    def _build_response(
        self,
        advisory: CropAdvisoryResponse,
        sections: Dict[str, str],
        status: ExplanationProviderStatus,
        model_used: Optional[str],
        language: str,
    ) -> ExplanationResponse:
        primary = advisory.primary_advisory
        is_mr = language == "mr"
        return ExplanationResponse(
            advisory_id=primary.advisory_id,
            location_id=advisory.location_id,
            block_name=advisory.block_name,
            district_name=advisory.district_name,
            crop_id=advisory.crop_id,
            crop_name=primary.crop_name_mr if is_mr else primary.crop_name,
            stage_id=advisory.stage_id,
            stage_name=primary.stage_name_mr if is_mr else primary.stage_name,
            language=language,
            provider_status=status,
            model_used=model_used,
            summary=sections.get("summary", ""),
            signal_explanation=sections.get("signal_explanation", ""),
            reasoning_summary=sections.get("reasoning_summary", ""),
            action_explanation=sections.get("action_explanation", ""),
            uncertainty=sections.get("uncertainty", ""),
            canonical_primary_action=primary.primary_action_mr if is_mr else primary.primary_action_en,
            canonical_priority=primary.priority.value,
            rule_id=primary.rule_id,
            rule_version=primary.rule_version,
            provenance=primary.provenance,
            generated_at=datetime.now(timezone.utc),
        )


explanation_service = ExplanationService()
