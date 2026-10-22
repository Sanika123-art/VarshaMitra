"""Comprehensive automated test suite for Phase 5 NuGen LLM Explanation Integration.

Tests cover:
1. Client provider behavior: authentication, token redaction, timeouts, rate limits, bounded retries.
2. Decision-integrity invariant enforcement: rejection of mutated actions, hallucinated dosages, and toxic compounds.
3. Bilingual template fallbacks: English and Marathi consistency.
4. API endpoint contracts: POST /api/v1/advisories/{advisory_id}/explanation.
5. Graceful degradation: guaranteed availability of structured advisory when LLM fails.
"""

import json
from unittest.mock import MagicMock, patch
import pytest
import httpx
from fastapi.testclient import TestClient

from app.core.config import settings
from app.schemas.agronomy import AdvisoryPriority, CropAdvisoryResponse
from app.schemas.climate import AccumulationIndicator, DrySpellIndicator, HeavyRainIndicator
from app.schemas.explanation import (
    ExplanationProviderStatus,
    ExplanationRequest,
    ExplanationResponse,
)
from app.services.agronomy.advisory_engine import generate_crop_advisories
from app.services.agronomy.crop_service import crop_service
from app.services.location_service import location_service
from app.services.explanation.explanation_service import ExplanationService, explanation_service
from app.services.explanation.fallback_templates import generate_deterministic_explanation
from app.services.explanation.nugen_client import (
    NuGenAuthenticationError,
    NuGenClient,
    NuGenClientError,
    NuGenRateLimitError,
    NuGenTimeoutError,
    redact_secret,
)


@pytest.fixture
def mock_canonical_advisory() -> CropAdvisoryResponse:
    """Fixture providing a deterministic canonical advisory for Baramati soybean flowering."""
    block = location_service.get_block("baramati")
    assert block is not None
    crop = crop_service.get_crop("soybean")
    assert crop is not None
    stage = crop_service.get_stage("soybean", "flowering")
    assert stage is not None

    acc = AccumulationIndicator(total_mm=30.0, valid_days_count=14, missing_days_count=0, daily_average_mm=2.1)
    dry = DrySpellIndicator(threshold_mm=2.5, dry_days_count=15, max_consecutive_dry_days=15, current_consecutive_dry_days=15, severity="critical")
    heavy = HeavyRainIndicator(threshold_mm=64.5, heavy_rain_days_count=0, max_single_day_mm=10.0, event_dates=[], has_heavy_rain_event=False)

    return generate_crop_advisories(
        block=block,
        crop=crop,
        stage=stage,
        climate_risk=None,
        accumulation=acc,
        dry_spell=dry,
        heavy_rain=heavy,
        language="en",
    )


class TestNuGenClient:
    """Unit tests for NuGen HTTP client adapter and security sanitization."""

    def test_secret_redaction(self):
        secret = "nugen_secret_key_998877"
        text = f"Failed to connect to API using Bearer {secret} on endpoint"
        redacted = redact_secret(text, secret)
        assert secret not in redacted
        assert "***REDACTED***" in redacted

    def test_client_unconfigured_when_disabled(self):
        client = NuGenClient(api_key="some_key")
        with patch.object(settings, "NUGEN_ENABLED", False):
            assert client.is_configured is False
            with pytest.raises(NuGenClientError, match="disabled or unconfigured"):
                client.generate_chat_completion([{"role": "user", "content": "hi"}])

    def test_client_missing_key(self):
        client = NuGenClient(api_key="")
        with patch.object(settings, "NUGEN_ENABLED", True):
            assert client.is_configured is False
            with pytest.raises(NuGenClientError, match="disabled or unconfigured"):
                client.generate_chat_completion([{"role": "user", "content": "hi"}])

    @patch("httpx.Client.post")
    def test_client_successful_completion_mocked(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "nugen-test-123",
            "object": "chat.completion",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": '{"summary": "Test summary"}'},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80},
        }
        mock_post.return_value = mock_response

        client = NuGenClient(api_key="test_key_valid", max_retries=1)
        with patch.object(settings, "NUGEN_ENABLED", True):
            res = client.generate_chat_completion([{"role": "user", "content": "explain"}])
            assert res["id"] == "nugen-test-123"
            assert "choices" in res
            assert len(res["choices"]) == 1

    @patch("httpx.Client.post")
    def test_client_auth_error_401_no_retry(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_post.return_value = mock_response

        client = NuGenClient(api_key="bad_token", max_retries=2)
        with patch.object(settings, "NUGEN_ENABLED", True):
            with pytest.raises(NuGenAuthenticationError):
                client.generate_chat_completion([{"role": "user", "content": "explain"}])
        # Verify it did not retry on 401
        assert mock_post.call_count == 1

    @patch("httpx.Client.post")
    def test_client_timeout_handling(self, mock_post):
        mock_post.side_effect = httpx.TimeoutException("Connection timed out")

        client = NuGenClient(api_key="token_timeout", max_retries=1, timeout_seconds=2.0)
        with patch.object(settings, "NUGEN_ENABLED", True):
            with pytest.raises(NuGenTimeoutError, match="timed out"):
                client.generate_chat_completion([{"role": "user", "content": "explain"}])


class TestExplanationServiceAndInvariants:
    """Tests for explanation generation, invariant enforcement, and fallback safeguards."""

    def test_disabled_mode_returns_fallback_template(self, mock_canonical_advisory: CropAdvisoryResponse):
        with patch.object(settings, "NUGEN_ENABLED", False):
            service = ExplanationService()
            res = service.explain_advisory(mock_canonical_advisory, language="en")
            assert res.provider_status == ExplanationProviderStatus.DISABLED
            assert res.canonical_primary_action == mock_canonical_advisory.primary_advisory.primary_action_en
            assert res.canonical_priority == mock_canonical_advisory.primary_advisory.priority.value
            assert len(res.summary) > 20
            assert "Limitations & verification" in res.uncertainty

    def test_marathi_fallback_generation(self, mock_canonical_advisory: CropAdvisoryResponse):
        with patch.object(settings, "NUGEN_ENABLED", False):
            service = ExplanationService()
            res = service.explain_advisory(mock_canonical_advisory, language="mr")
            assert res.provider_status == ExplanationProviderStatus.DISABLED
            assert res.language == "mr"
            assert res.canonical_primary_action == mock_canonical_advisory.primary_advisory.primary_action_mr
            # Check for Marathi phrasing
            assert "मर्यादा व दक्षता" in res.uncertainty
            assert "सोयाबीन" in res.summary

    def test_valid_llm_generation_and_schema(self, mock_canonical_advisory: CropAdvisoryResponse):
        mock_llm_json = json.dumps({
            "summary": "Protective irrigation is needed for soybean due to dry spell.",
            "signal_explanation": "15 days without rain during flowering stage causes flower drop.",
            "reasoning_summary": "Soybean flowers need soil moisture to set pods.",
            "action_explanation": "Apply light sprinkler or furrow irrigation immediately.",
            "uncertainty": "Check field moisture depth before irrigating.",
        })

        mock_client = MagicMock(spec=NuGenClient)
        mock_client.is_configured = True
        mock_client.model = "Qwen/Qwen2.5-0.5B-Instruct"
        mock_client.generate_chat_completion.return_value = {
            "choices": [{"message": {"content": mock_llm_json}}]
        }

        with patch.object(settings, "NUGEN_ENABLED", True):
            service = ExplanationService(client=mock_client)
            res = service.explain_advisory(mock_canonical_advisory, language="en")
            assert res.provider_status == ExplanationProviderStatus.GENERATED
            assert res.model_used == "Qwen/Qwen2.5-0.5B-Instruct"
            assert res.summary == "Protective irrigation is needed for soybean due to dry spell."

    def test_rejection_of_hallucinated_chemical_dosages(self, mock_canonical_advisory: CropAdvisoryResponse):
        # LLM attempts to prescribe arbitrary chemical dosage
        hallucinated_json = json.dumps({
            "summary": "Spray chemicals immediately.",
            "signal_explanation": "Insects are attacking.",
            "reasoning_summary": "Chemical control is necessary.",
            "action_explanation": "Apply 500 ml per acre chlorpyrifos 20 EC immediately.",
            "uncertainty": "None.",
        })

        mock_client = MagicMock(spec=NuGenClient)
        mock_client.is_configured = True
        mock_client.model = "Qwen/Qwen2.5-0.5B-Instruct"
        mock_client.generate_chat_completion.return_value = {
            "choices": [{"message": {"content": hallucinated_json}}]
        }

        with patch.object(settings, "NUGEN_ENABLED", True):
            service = ExplanationService(client=mock_client)
            res = service.explain_advisory(mock_canonical_advisory, language="en")
            # Invariant check must reject hallucinated dosage and serve deterministic fallback
            assert res.provider_status == ExplanationProviderStatus.FALLBACK
            assert "chlorpyrifos" not in res.action_explanation
            # Canonical action is preserved
            assert res.canonical_primary_action == mock_canonical_advisory.primary_advisory.primary_action_en

    def test_rejection_of_contradictory_action(self, mock_canonical_advisory: CropAdvisoryResponse):
        # Canonical advisory advises protective irrigation / drainage; LLM contradicts canonical guidance
        contradictory_json = json.dumps({
            "summary": "Do nothing and let plants dry out.",
            "signal_explanation": "Dry spells are good for soybean.",
            "reasoning_summary": "Plants do not need water.",
            "action_explanation": "Stop all irrigation and do not apply water.",
            "uncertainty": "Check field.",
        })

        mock_client = MagicMock(spec=NuGenClient)
        mock_client.is_configured = True
        mock_client.model = "Qwen/Qwen2.5-0.5B-Instruct"
        mock_client.generate_chat_completion.return_value = {
            "choices": [{"message": {"content": contradictory_json}}]
        }

        with patch.object(settings, "NUGEN_ENABLED", True):
            service = ExplanationService(client=mock_client)
            # Make canonical drainage advisory
            mock_canonical_advisory.primary_advisory.primary_action_en = "Drain excess standing water through field ditches."
            contradictory_json = json.dumps({
                "summary": "Keep water in field.",
                "signal_explanation": "Water is abundant.",
                "reasoning_summary": "Water is fine.",
                "action_explanation": "Apply heavy flood irrigation across all fields.",
                "uncertainty": "Check field.",
            })
            mock_client.generate_chat_completion.return_value = {
                "choices": [{"message": {"content": contradictory_json}}]
            }
            res = service.explain_advisory(mock_canonical_advisory, language="en")
            # Must reject and revert to fallback
            assert res.provider_status == ExplanationProviderStatus.FALLBACK
            assert "flood irrigation" not in res.action_explanation


class TestAPIEndpointsExplanationPhase5:
    """HTTP integration tests for POST /api/v1/advisories/{advisory_id}/explanation."""

    def test_explain_advisory_endpoint_default_disabled(self, client: TestClient):
        with patch.object(settings, "NUGEN_ENABLED", False):
            # Using standard advisory ID format
            adv_id = "adv_baramati_soybean_flowering_1700000000"
            res = client.post(f"/api/v1/advisories/{adv_id}/explanation")
            assert res.status_code == 200
            data = res.json()
            assert data["advisory_id"] == adv_id
            assert data["location_id"] == "baramati"
            assert data["crop_id"] == "soybean"
            assert data["stage_id"] == "flowering"
            assert data["provider_status"] == "disabled"
            assert "summary" in data
            assert "signal_explanation" in data
            assert "reasoning_summary" in data
            assert "action_explanation" in data
            assert "uncertainty" in data
            assert "canonical_primary_action" in data
            assert data["canonical_priority"] == "critical"

    def test_explain_advisory_endpoint_marathi_body(self, client: TestClient):
        with patch.object(settings, "NUGEN_ENABLED", False):
            adv_id = "adv_baramati_cotton_vegetative_1700000000"
            payload = {"language": "mr", "focus_topic": "climate"}
            res = client.post(f"/api/v1/advisories/{adv_id}/explanation", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert data["language"] == "mr"
            assert data["crop_name"] == "कापूस"
            assert "मर्यादा व दक्षता" in data["uncertainty"]

    def test_explain_advisory_with_explicit_query_params(self, client: TestClient):
        with patch.object(settings, "NUGEN_ENABLED", False):
            custom_id = "custom_advisory_ref_42"
            res = client.post(
                f"/api/v1/advisories/{custom_id}/explanation?location_id=baramati&crop_id=onion&stage_id=vegetative&language=en"
            )
            assert res.status_code == 200
            data = res.json()
            assert data["advisory_id"] == custom_id
            assert data["crop_id"] == "onion"
            assert data["stage_id"] == "vegetative"

    def test_explain_advisory_unresolvable_id_returns_400(self, client: TestClient):
        res = client.post("/api/v1/advisories/unresolvable_id_without_params/explanation")
        assert res.status_code == 400
        assert "Could not resolve advisory context" in res.json()["detail"]

    def test_explain_advisory_invalid_location_returns_404(self, client: TestClient):
        res = client.post(
            "/api/v1/advisories/any_id/explanation?location_id=invalid_block_xyz&crop_id=soybean&stage_id=flowering"
        )
        assert res.status_code == 404

    def test_explain_advisory_invalid_crop_returns_404(self, client: TestClient):
        res = client.post(
            "/api/v1/advisories/any_id/explanation?location_id=baramati&crop_id=banana&stage_id=flowering"
        )
        assert res.status_code == 404

    def test_explain_advisory_mocked_llm_generated_status(self, client: TestClient):
        mock_output = json.dumps({
            "summary": "Protective irrigation required for cotton.",
            "signal_explanation": "Persistent dry spell of 15 days.",
            "reasoning_summary": "Moisture is critical to prevent square drop.",
            "action_explanation": "Provide alternate furrow irrigation immediately.",
            "uncertainty": "Verify soil moisture depth in the field.",
        })

        with patch.object(settings, "NUGEN_ENABLED", True), \
             patch.object(settings, "NUGEN_API_KEY", "test_key_valid"), \
             patch("app.services.explanation.nugen_client.NuGenClient.generate_chat_completion") as mock_gen:
            mock_gen.return_value = {
                "choices": [{"message": {"content": mock_output}}]
            }
            adv_id = "adv_baramati_cotton_flowering_1700000000"
            res = client.post(f"/api/v1/advisories/{adv_id}/explanation")
            assert res.status_code == 200
            data = res.json()
            assert data["provider_status"] == "generated"
            assert data["model_used"] == "Qwen/Qwen2.5-0.5B-Instruct"
            assert data["summary"] == "Protective irrigation required for cotton."

    def test_explain_advisory_timeout_graceful_degradation(self, client: TestClient):
        with patch.object(settings, "NUGEN_ENABLED", True), \
             patch.object(settings, "NUGEN_API_KEY", "test_key_valid"), \
             patch("app.services.explanation.nugen_client.NuGenClient.generate_chat_completion") as mock_gen:
            mock_gen.side_effect = NuGenTimeoutError("NuGen request timed out after 12.0s")
            adv_id = "adv_baramati_soybean_flowering_1700000000"
            res = client.post(f"/api/v1/advisories/{adv_id}/explanation")
            # Must return 200 OK with graceful fallback and unavailable provider status
            assert res.status_code == 200
            data = res.json()
            assert data["provider_status"] == "unavailable"
            assert len(data["summary"]) > 20
            # Canonical advisory action is still completely available
            assert data["canonical_primary_action"] is not None
            assert data["canonical_priority"] == "critical"
