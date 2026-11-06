import { test, describe } from "node:test";
import assert from "node:assert";
import { api } from "../src/lib/api/client.ts";

describe("Phase 6 End-to-End Live Integration Verification", () => {
  test("1. Backend Health Endpoint returns 200 OK and healthy status", async () => {
    const health = await api.getHealth();
    assert.strictEqual(health.status, "healthy");
    assert.ok(health.service.includes("varshamitra"), `Expected varshamitra service name, got ${health.service}`);
  });

  test("2. Location API returns verified Maharashtra districts and blocks", async () => {
    const districts = await api.getDistricts();
    assert.ok(districts.length >= 7, `Expected at least 7 focus districts, got ${districts.length}`);
    const pune = districts.find((d) => d.id === "pune");
    assert.ok(pune, "Pune district must be present");
    const blocks = await api.getBlocks("pune");
    assert.ok(blocks.some((b) => b.id === "baramati"), "Baramati block must be present");
  });

  test("3. Open-Meteo Rainfall Forecast returns 14-day daily precipitation", async () => {
    const forecast = await api.getForecast("baramati", 14);
    assert.strictEqual(forecast.block_id, "baramati");
    assert.ok(forecast.forecast.length >= 1, "Forecast days must be returned");
    assert.ok(typeof forecast.forecast[0].precipitation_sum_mm === "number");
    assert.ok(forecast.provider.provider_name.length > 0);
  });

  test("4. Climate Indicators API returns validated deterministic metrics", async () => {
    const indicators = await api.getClimateIndicators("baramati", 14);
    assert.strictEqual(indicators.block_id, "baramati");
    assert.ok(indicators.accumulation, "Accumulation metrics must be present");
    assert.ok(indicators.dry_spell, "Dry spell indicator must be present");
    assert.ok(indicators.monsoon_onset, "Monsoon onset indicator must be present");
  });

  test("5. Climate Risk Engine returns categorical risk & explainable drivers", async () => {
    const risk = await api.getClimateRisk("baramati");
    assert.strictEqual(risk.block_id, "baramati");
    assert.ok(["low", "moderate", "high", "critical", "insufficient_data"].includes(risk.overall_risk));
    assert.ok(Array.isArray(risk.risk_drivers));
    assert.ok((risk.methodology || risk.evaluation_method || "").length > 0);
  });

  test("6. Regional Soil Service returns soil properties with truthful provenance", async () => {
    const soil = await api.getRegionalSoil("baramati");
    assert.strictEqual(soil.location_id, "baramati");
    assert.ok(typeof soil.topsoil_ph === "number");
    assert.ok(typeof soil.organic_carbon_pct === "number");
    assert.ok(soil.dominant_texture.length > 0);
    assert.ok(soil.source.length > 0);
    assert.ok(soil.limitations.length > 0, "Limitations must clarify this is a regional estimate");
  });

  test("7. Crop Suitability Service evaluates Kharif candidates", async () => {
    const suitability = await api.getCropSuitability("baramati", "kharif", "rainfed");
    assert.strictEqual(suitability.location_id, "baramati");
    assert.ok(suitability.candidate_crops.length >= 5, "Candidate crops must be evaluated");
    const soybean = suitability.candidate_crops.find((c) => c.crop_id === "soybean");
    assert.ok(soybean, "Soybean suitability must be evaluated");
    assert.ok(["suitable", "conditionally_suitable", "unsuitable", "insufficient_data"].includes(soybean.status));
  });

  test("8. Sowing Readiness Service evaluates local moisture & sowing window", async () => {
    const sowing = await api.getSowingReadiness("baramati", "soybean");
    assert.strictEqual(sowing.location_id, "baramati");
    assert.strictEqual(sowing.crop_id, "soybean");
    assert.ok(["favorable", "wait_and_reassess", "unfavorable", "insufficient_data"].includes(sowing.status));
    assert.ok(sowing.sowing_readiness_summary_en.length > 0);
    assert.ok(typeof sowing.antecedent_rainfall_7d_mm === "number");
  });

  test("9. Crop Advisory Engine returns verified MPKV agronomic guidance", async () => {
    const advisory = await api.getCropAdvisory("baramati", "soybean", "sowing", "en");
    assert.strictEqual(advisory.crop_id, "soybean");
    assert.strictEqual(advisory.stage_id, "sowing");
    assert.ok(advisory.primary_advisory, "Primary advisory must be present");
    assert.ok(advisory.primary_advisory.primary_action_en.length > 0);
    assert.ok(advisory.primary_advisory.provenance.includes("MPKV") || advisory.primary_advisory.provenance.includes("ICAR"));
  });

  test("10. NuGen Explanation Layer provides grounded natural-language explanation", async () => {
    const explanation = await api.getAdvisoryExplanation("adv_baramati_soybean_sowing_20261022", {
      locationId: "baramati",
      cropId: "soybean",
      stageId: "sowing",
      language: "en",
    });
    assert.ok(explanation.summary.length > 0, "Explanation summary must be present");
    assert.ok(explanation.signal_explanation.length > 0);
    assert.ok(explanation.reasoning_summary.length > 0);
    assert.ok(explanation.action_explanation.length > 0);
    assert.ok(["generated", "fallback", "disabled", "unavailable"].includes(explanation.provider_status));
  });

  test("11. Dataset Storage Summary returns persistent store metrics", async () => {
    const summary = await api.getDatasetSummary();
    assert.ok(typeof summary.total_records === "number");
    assert.ok(typeof summary.valid_records === "number");
  });

  test("12. Risk Summary API returns all curated Maharashtra blocks with live risk ratings", async () => {
    const summary = await api.getRiskSummary(14);
    assert.ok(summary.count > 0, "Summary count must be positive");
    assert.strictEqual(summary.items.length, summary.count);
    assert.ok(summary.available_count > 0, "Available block count must be positive");
    assert.ok(summary.coordinates_note.length > 0);
    assert.ok(Array.isArray(summary.items));

    const baramati = summary.items.find((i) => i.block_id === "baramati");
    assert.ok(baramati, "Baramati must exist in risk summary");
    assert.strictEqual(baramati.status, "ok");
    assert.ok(["low", "moderate", "high", "critical", "insufficient_data"].includes(baramati.overall_risk ?? ""));
    assert.ok(typeof baramati.latitude === "number");
    assert.ok(typeof baramati.longitude === "number");
  });

  test("13. Saarthi Chatbot API supports conversation creation, persistent message exchange and history", async () => {
    // Create consultation
    const conv = await api.createChatConversation({
      locationId: "baramati",
      cropId: "soybean",
      language: "en",
    });
    assert.ok(conv.id.startsWith("conv_"));

    // Send question
    const reply = await api.sendChatMessage(conv.id, "Will it rain this week?", {
      locationId: "baramati",
      cropId: "soybean",
      language: "en",
    });
    assert.strictEqual(reply.role, "assistant");
    assert.ok(reply.content.length > 20);
    assert.ok(reply.provider_status === "nugen" || reply.provider_status === "engine_fallback");

    // Fetch conversation detail to verify SQLite persistence
    const detail = await api.getChatConversation(conv.id);
    assert.strictEqual(detail.id, conv.id);
    assert.strictEqual(detail.message_count, 2);
    assert.strictEqual(detail.messages[0].role, "user");
    assert.strictEqual(detail.messages[1].role, "assistant");

    // Cleanup
    await api.deleteChatConversation(conv.id);
  });
});
