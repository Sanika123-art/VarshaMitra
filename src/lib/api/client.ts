/**
 * Centralized, typed API Client for VarshaMitra.
 * Connects the Next.js frontend to the FastAPI backend.
 */

import type {
  BlockDetail,
  ChatConversationDetail,
  ChatConversationItem,
  ChatMessageItem,
  ClimateIndicatorsResponse,
  CropAdvisoryResponse,
  CropRequirement,
  DatasetSummaryResponse,
  DistrictDetail,
  ExplanationResponse,
  ForecastSeries,
  FarmerFeedbackList,
  FarmerFeedbackPost,
  HistoricalTrendsResponse,
  LocationResolveRequest,
  LocationSearchItem,
  LocationSearchResponse,
  MandiRateResponse,
  RegionalSoilSummaryResponse,
  RiskAssessmentResponse,
  RiskSummaryResponse,
  SowingAssessmentResponse,
  SuitabilityAssessmentResponse,
} from "./types";

export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
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
      let errorDetail: unknown = null;
      let errorMsg = `API request failed with status ${response.status}`;
      try {
        const body = (await response.json()) as { detail?: unknown };
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
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    const err = error as Error;
    if (err?.name === "AbortError") {
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

  // Locations & Geocoding
  async searchLocations(query: string, limit: number = 6): Promise<LocationSearchResponse> {
    return request(`/api/v1/locations/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  async reverseGeocodeLocation(lat: number, lon: number): Promise<LocationSearchItem> {
    return request(`/api/v1/locations/reverse?lat=${lat}&lon=${lon}`);
  },

  async resolveLocation(payload: LocationResolveRequest): Promise<BlockDetail> {
    return request("/api/v1/locations/resolve", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getDistricts(): Promise<DistrictDetail[]> {
    return request("/api/v1/locations/districts");
  },

  async getDistrict(districtId: string): Promise<DistrictDetail> {
    return request(`/api/v1/locations/districts/${encodeURIComponent(districtId)}`);
  },

  async getBlocks(districtId?: string): Promise<BlockDetail[]> {
    const q = districtId ? `?district_id=${encodeURIComponent(districtId)}` : "";
    const res = await request<BlockDetail[] | { items: BlockDetail[] }>(`/api/v1/locations/blocks${q}`);
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

  async getRiskSummary(windowDays: number = 14, provider: string = "open-meteo"): Promise<RiskSummaryResponse> {
    return request(`/api/v1/risk/summary?window_days=${windowDays}&provider=${encodeURIComponent(provider)}`);
  },

  async getRiskBoundaries(): Promise<unknown> {
    return request("/api/v1/risk/boundaries");
  },

  // Soil Intelligence
  async getRegionalSoil(blockId: string): Promise<RegionalSoilSummaryResponse> {
    return request(`/api/v1/soil/${encodeURIComponent(blockId)}`);
  },

  // Crop Catalogue & Agronomy
  async getCrops(
    filter?: { season?: string; category?: string; search?: string } | string
  ): Promise<CropRequirement[]> {
    if (typeof filter === "string") {
      const q = filter ? `?season=${encodeURIComponent(filter)}` : "";
      return request(`/api/v1/crops${q}`);
    }
    const params = new URLSearchParams();
    if (filter?.season) params.set("season", filter.season);
    if (filter?.category) params.set("category", filter.category);
    if (filter?.search) params.set("search", filter.search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/v1/crops${qs}`);
  },

  async getCropDetails(cropId: string): Promise<CropRequirement> {
    return request(`/api/v1/crops/details/${encodeURIComponent(cropId)}`);
  },

  async getCropSuitability(
    blockId: string,
    season: string = "kharif",
    waterSource: string = "rainfed",
    cropId?: string
  ): Promise<SuitabilityAssessmentResponse> {
    const params = new URLSearchParams({ season, water_source: waterSource });
    if (cropId) params.set("crop_id", cropId);
    return request(`/api/v1/crops/suitability/${encodeURIComponent(blockId)}?${params.toString()}`);
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

  // Dynamic Historical Trends & Climatology
  async getHistoricalTrends(blockId?: string): Promise<HistoricalTrendsResponse> {
    const query = blockId ? `?block_id=${encodeURIComponent(blockId)}` : "";
    return request(`/api/v1/dataset/historical-trends${query}`);
  },

  // Saarthi AI Farming Companion
  async createChatConversation(payload: {
    locationId?: string;
    cropId?: string;
    stageId?: string;
    language?: string;
    title?: string;
  } = {}): Promise<ChatConversationItem> {
    return request("/api/v1/chat/conversations", {
      method: "POST",
      body: JSON.stringify({
        location_id: payload.locationId,
        crop_id: payload.cropId,
        stage_id: payload.stageId,
        language: payload.language ?? "en",
        title: payload.title,
      }),
    });
  },

  async getMandiRates(cropId: string, blockId?: string): Promise<MandiRateResponse> {
    const params = new URLSearchParams({ crop_id: cropId });
    if (blockId) params.set("block_id", blockId);
    return request(`/api/v1/mandi/rates?${params.toString()}`);
  },

  async getFarmerFeedback(): Promise<FarmerFeedbackList> {
    return request("/api/v1/community/feedback");
  },

  async postFarmerFeedback(payload: {
    display_name?: string;
    district: string;
    taluka?: string;
    rating: FarmerFeedbackPost["rating"];
    message: string;
  }): Promise<FarmerFeedbackPost> {
    return request("/api/v1/community/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getChatConversations(): Promise<ChatConversationItem[]> {
    return request("/api/v1/chat/conversations");
  },

  async getChatConversation(conversationId: string): Promise<ChatConversationDetail> {
    return request(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}`);
  },

  async sendChatMessage(
    conversationId: string,
    content: string,
    context?: {
      locationId?: string;
      cropId?: string;
      stageId?: string;
      language?: string;
    }
  ): Promise<ChatMessageItem> {
    const params = new URLSearchParams();
    if (context?.locationId) params.set("location_id", context.locationId);
    if (context?.cropId) params.set("crop_id", context.cropId);
    if (context?.stageId) params.set("stage_id", context.stageId);
    if (context?.language) params.set("language", context.language);
    const qs = params.toString() ? `?${params.toString()}` : "";

    return request(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages${qs}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  async updateChatConversation(conversationId: string, title: string): Promise<{ status: string }> {
    return request(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  },

  async deleteChatConversation(conversationId: string): Promise<{ status: string }> {
    return request(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
    });
  },

  async clearChatConversations(): Promise<{ status: string; cleared_conversations_count: number }> {
    return request("/api/v1/chat/conversations", {
      method: "DELETE",
    });
  },
};
