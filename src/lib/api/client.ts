/**
 * Centralized, typed API Client for VarshaMitra.
 * Connects the Next.js frontend to the FastAPI backend.
 */

import type {
  BlockDetail,
  ClimateIndicatorsResponse,
  CropAdvisoryResponse,
  CropRequirement,
  DatasetSummaryResponse,
  DistrictDetail,
  ExplanationResponse,
  ForecastSeries,
  RegionalSoilSummaryResponse,
  RiskAssessmentResponse,
  SowingAssessmentResponse,
  SuitabilityAssessmentResponse,
} from "./types";

export class ApiError extends Error {
  status: number;
  detail?: any;

  constructor(status: number, message: string, detail?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
  }
  return DEFAULT_BASE_URL;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const timeoutMs = options.timeoutMs ?? 10000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail: any = null;
      let errorMsg = `API request failed with status ${response.status}`;
      try {
        const body = await response.json();
        errorDetail = body;
        if (body?.detail) {
          errorMsg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch {
        // non-JSON error
      }
      throw new ApiError(response.status, errorMsg, errorDetail);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === "AbortError") {
      throw new ApiError(408, `Request timeout after ${timeoutMs}ms connecting to ${url}`);
    }
    throw new ApiError(503, `Network error: Failed to fetch from VarshaMitra API at ${url}`);
  }
}

export const api = {
  // Service health
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    return request("/health");
  },

  // Locations
  async getDistricts(): Promise<DistrictDetail[]> {
    return request("/api/v1/locations/districts");
  },

  async getDistrict(districtId: string): Promise<DistrictDetail> {
    return request(`/api/v1/locations/districts/${encodeURIComponent(districtId)}`);
  },

  async getBlocks(districtId?: string): Promise<BlockDetail[]> {
    const q = districtId ? `?district_id=${encodeURIComponent(districtId)}` : "";
    const res = await request<any>(`/api/v1/locations/blocks${q}`);
    return Array.isArray(res) ? res : (res?.items ?? []);
  },

  async getBlock(blockId: string): Promise<BlockDetail> {
    return request(`/api/v1/locations/blocks/${encodeURIComponent(blockId)}`);
  },

  // Rainfall & Weather
  async getForecast(blockId: string, days: number = 14): Promise<ForecastSeries> {
    return request(`/api/v1/rainfall/forecast/${encodeURIComponent(blockId)}?days=${days}`);
  },

  // Climate Indicators & Risk
  async getClimateIndicators(blockId: string, windowDays: number = 14): Promise<ClimateIndicatorsResponse> {
    return request(`/api/v1/climate/indicators/${encodeURIComponent(blockId)}?window_days=${windowDays}`);
  },

  async getClimateRisk(blockId: string): Promise<RiskAssessmentResponse> {
    return request(`/api/v1/risk/${encodeURIComponent(blockId)}`);
  },

  // Soil Intelligence
  async getRegionalSoil(blockId: string): Promise<RegionalSoilSummaryResponse> {
    return request(`/api/v1/soil/${encodeURIComponent(blockId)}`);
  },

  // Crop Catalogue & Agronomy
  async getCrops(season?: string): Promise<CropRequirement[]> {
    const q = season ? `?season=${encodeURIComponent(season)}` : "";
    return request(`/api/v1/crops${q}`);
  },

  async getCropDetails(cropId: string): Promise<CropRequirement> {
    return request(`/api/v1/crops/details/${encodeURIComponent(cropId)}`);
  },

  async getCropSuitability(
    blockId: string,
    season: string = "kharif",
    waterSource: string = "rainfed"
  ): Promise<SuitabilityAssessmentResponse> {
    const q = `?season=${encodeURIComponent(season)}&water_source=${encodeURIComponent(waterSource)}`;
    return request(`/api/v1/crops/suitability/${encodeURIComponent(blockId)}${q}`);
  },

  async getSowingReadiness(
    blockId: string,
    cropId: string = "soybean",
    targetDate?: string
  ): Promise<SowingAssessmentResponse> {
    const d = targetDate ? `&target_date=${encodeURIComponent(targetDate)}` : "";
    return request(`/api/v1/crops/sowing-readiness/${encodeURIComponent(blockId)}?crop_id=${encodeURIComponent(cropId)}${d}`);
  },

  // Advisories & NuGen Explanations
  async getCropAdvisory(
    locationId: string,
    cropId: string,
    stageId: string,
    language: string = "en"
  ): Promise<CropAdvisoryResponse> {
    const q = `?location_id=${encodeURIComponent(locationId)}&crop_id=${encodeURIComponent(cropId)}&stage_id=${encodeURIComponent(stageId)}&language=${encodeURIComponent(language)}`;
    return request(`/api/v1/advisories${q}`);
  },

  async getAdvisoryExplanation(
    advisoryId: string,
    options: {
      locationId?: string;
      cropId?: string;
      stageId?: string;
      language?: string;
    } = {}
  ): Promise<ExplanationResponse> {
    const params = new URLSearchParams();
    if (options.locationId) params.set("location_id", options.locationId);
    if (options.cropId) params.set("crop_id", options.cropId);
    if (options.stageId) params.set("stage_id", options.stageId);
    if (options.language) params.set("language", options.language);
    const qs = params.toString() ? `?${params.toString()}` : "";

    return request(`/api/v1/advisories/${encodeURIComponent(advisoryId)}/explanation${qs}`, {
      method: "POST",
      body: JSON.stringify({ language: options.language ?? "en" }),
    });
  },

  // Historical Storage Summary
  async getDatasetSummary(): Promise<DatasetSummaryResponse> {
    return request("/api/v1/dataset/summary");
  },
};
