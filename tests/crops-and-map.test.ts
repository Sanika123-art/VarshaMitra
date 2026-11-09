import { test, describe } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { crops, getCrop } from "../src/data/crops.ts";
import { layerRisk } from "../src/features/risk-map/riskLayers.ts";
import { riskColor } from "../src/lib/utils.ts";
import type { RiskSummaryItem } from "../src/lib/api/types.ts";

describe("Expanded Crop Catalogue & Map Intelligence Suite", () => {
  test("Frontend crops catalogue defines at least 20 authentic Maharashtra crops", () => {
    assert.ok(crops.length >= 20, `Expected at least 20 crops, got ${crops.length}`);
    const expectedIds = [
      "soybean", "cotton", "pigeonpea", "pearl_millet", "sorghum",
      "rice", "wheat", "maize", "finger_millet", "chickpea",
      "green_gram", "black_gram", "groundnut", "sunflower", "sesame",
      "safflower", "onion", "tomato", "chilli", "potato",
      "sugarcane", "pomegranate", "grapes", "banana",
    ];
    for (const id of expectedIds) {
      const found = crops.find((c) => c.id === id);
      assert.ok(found, `Expected crop ${id} to be present in catalogue`);
      assert.ok(found.stages.length >= 3, `Expected crop ${id} to have at least 3 growth stages`);
    }
  });

  test("getCrop resolves canonical IDs and historical aliases seamlessly", () => {
    assert.strictEqual(getCrop("soybean")?.id, "soybean");
    assert.strictEqual(getCrop("tur")?.id, "pigeonpea");
    assert.strictEqual(getCrop("jowar")?.id, "sorghum");
    assert.strictEqual(getCrop("bajra")?.id, "pearl_millet");
    assert.strictEqual(getCrop("harbara")?.id, "chickpea");
    assert.strictEqual(getCrop("keli")?.id, "banana");
    assert.strictEqual(getCrop("dalimb")?.id, "pomegranate");
    assert.strictEqual(getCrop("draksha")?.id, "grapes");
    assert.strictEqual(getCrop("paddy")?.id, "rice");
  });

  test("getCrop returns undefined for completely unknown crops", () => {
    assert.strictEqual(getCrop("dragonfruit_unknown"), undefined);
  });

  test("layerRisk derives categories strictly from backend item data", () => {
    const mockItem: RiskSummaryItem = {
      block_id: "baramati",
      block_name: "Baramati",
      block_name_mr: "बारामती",
      district_id: "pune",
      district_name: "Pune",
      latitude: 18.15,
      longitude: 74.58,
      status: "ok",
      overall_risk: "moderate",
      dry_spell_severity: "critical",
      heavy_rain_event: true,
      max_single_day_mm: 120.0,
      monsoon_onset_status: "delayed_onset",
      in_monsoon_season: true,
    };

    // Overall layer mirrors backend overall_risk
    assert.strictEqual(layerRisk(mockItem, "overall"), "moderate");

    // Dry spell layer derives from dry_spell_severity
    assert.strictEqual(layerRisk(mockItem, "drySpell"), "critical");

    // Heavy rain layer derives from heavy_rain_event and max_single_day_mm
    assert.strictEqual(layerRisk(mockItem, "heavyRain"), "critical");

    // Onset layer derives from monsoon_onset_status
    assert.strictEqual(layerRisk(mockItem, "onset"), "high");
    assert.strictEqual(layerRisk({ ...mockItem, monsoon_onset_status: "confirmed" }, "onset"), "low");
    assert.strictEqual(layerRisk({ ...mockItem, monsoon_onset_status: "pending" }, "onset"), "moderate");
    // Forecast and historical layers are not falsely derived from recent-past risk.
    assert.strictEqual(layerRisk(mockItem, "rainfallForecast"), "insufficient_data");
    assert.strictEqual(layerRisk(mockItem, "historicalRainfall"), "insufficient_data");

    const missingIndicatorItem: RiskSummaryItem = {
      ...mockItem,
      dry_spell_severity: null,
      heavy_rain_event: null,
      monsoon_onset_status: null,
    };
    assert.strictEqual(layerRisk(missingIndicatorItem, "drySpell"), "insufficient_data");
    assert.strictEqual(layerRisk(missingIndicatorItem, "heavyRain"), "insufficient_data");
    assert.strictEqual(layerRisk(missingIndicatorItem, "onset"), "insufficient_data");
    assert.strictEqual(layerRisk({ ...mockItem, overall_risk: "insufficient_data" }, "heavyRain"), "insufficient_data");
    assert.strictEqual(layerRisk({ ...mockItem, in_monsoon_season: false }, "drySpell"), "low");
    assert.strictEqual(layerRisk({ ...mockItem, freshness_status: "stale" }, "overall"), "insufficient_data");
    assert.strictEqual(layerRisk({ ...mockItem, freshness_status: "missing" }, "drySpell"), "insufficient_data");
    assert.strictEqual(layerRisk({ ...mockItem, freshness_status: "synthetic_staging_baseline" }, "onset"), "insufficient_data");

    // Unavailable status maps to insufficient_data
    const unavailableItem: RiskSummaryItem = {
      ...mockItem,
      status: "unavailable",
    };
    assert.strictEqual(layerRisk(unavailableItem, "overall"), "insufficient_data");
  });

  test("riskColor clearly distinguishes unavailable data from low risk", () => {
    assert.notStrictEqual(riskColor.insufficient_data, riskColor.low);
    assert.strictEqual(riskColor.insufficient_data, "#718096"); // Neutral slate grey
    assert.strictEqual(riskColor.low, "#4c8a58"); // Distinct forest green
  });

  test("Maharashtra map boundaries are sourced polygons with conservative risk links", async () => {
    const dataPath = new URL("../backend/app/data/maharashtra-taluka-boundaries.geojson", import.meta.url);
    const boundaryData = JSON.parse(await readFile(dataPath, "utf8")) as {
      type: string;
      metadata: { boundary_year: string; boundary_source: string; boundary_license: string };
      features: Array<{
        geometry: { type: string };
        properties: { shape_id: string; risk_block_id: string | null };
      }>;
    };

    assert.strictEqual(boundaryData.type, "FeatureCollection");
    assert.strictEqual(boundaryData.metadata.boundary_year, "2018");
    assert.match(boundaryData.metadata.boundary_source, /Local Government Directory/);
    assert.strictEqual(boundaryData.metadata.boundary_license, "Open Data Commons Open Database License 1.0");
    assert.ok(boundaryData.features.length >= 300);
    assert.ok(boundaryData.features.every((feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry.type)));

    const shapeIds = boundaryData.features.map((feature) => feature.properties.shape_id);
    assert.strictEqual(new Set(shapeIds).size, shapeIds.length);
    assert.ok(boundaryData.features.some((feature) => feature.properties.risk_block_id === null));
    assert.ok(boundaryData.features.filter((feature) => feature.properties.risk_block_id !== null).length >= 100);
  });
});
