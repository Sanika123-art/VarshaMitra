"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "@/lib/api";
import { riskColor } from "@/lib/utils";
import type { RiskSummaryItem } from "@/lib/api/types";
import type { RiskLevel } from "@/types";
import { layerRisk, type MapLayer } from "./riskLayers";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

interface BoundaryProperties {
  shape_id: string;
  area_name: string;
  district_name: string;
  district_id: string | null;
  center_longitude: number;
  center_latitude: number;
  risk_block_id: string | null;
}

type BoundaryGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;
type BoundaryFeatureCollection = GeoJSON.FeatureCollection<BoundaryGeometry, BoundaryProperties>;

interface StyledBoundaryProperties extends BoundaryProperties {
  risk: RiskLevel;
  riskColor: string;
  isSelected: number;
  isUserFarm: number;
  isVisible: number;
}

type StyledBoundaryCollection = GeoJSON.FeatureCollection<BoundaryGeometry, StyledBoundaryProperties>;
type RiskFilter = "all" | RiskLevel;

interface RiskMapProps {
  items: RiskSummaryItem[];
  visibleBlockIds: string[];
  layer: MapLayer;
  selectedBlockId: string | null;
  selectedDistrictId: string;
  selectedBlockFilter: string;
  riskFilter: RiskFilter;
  hasSearchQuery: boolean;
  flyTarget?: { center: [number, number]; zoom: number; key: number } | null;
  onSelect: (item: RiskSummaryItem) => void;
  onMapCoordinateSelect?: (lat: number, lon: number) => void;
  language: "en" | "mr";
  mapStyle?: "risk" | "roads" | "satellite";
  userFarmBlockId?: string;
}

const EMPTY_BOUNDARIES: StyledBoundaryCollection = {
  type: "FeatureCollection",
  features: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBoundaryFeatureCollection(value: unknown): value is BoundaryFeatureCollection {
  if (!isRecord(value) || value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    return false;
  }
  return value.features.every((feature) => {
    if (!isRecord(feature) || feature.type !== "Feature" || !isRecord(feature.geometry) || !isRecord(feature.properties)) {
      return false;
    }
    const geometry = feature.geometry;
    const properties = feature.properties;
    return (
      (geometry.type === "Polygon" || geometry.type === "MultiPolygon")
      && Array.isArray(geometry.coordinates)
      && typeof properties.shape_id === "string"
      && typeof properties.area_name === "string"
      && typeof properties.district_name === "string"
      && (typeof properties.district_id === "string" || properties.district_id === null)
      && typeof properties.center_longitude === "number"
      && typeof properties.center_latitude === "number"
      && (typeof properties.risk_block_id === "string" || properties.risk_block_id === null)
    );
  });
}

function getBoundaryBounds(boundaries: BoundaryFeatureCollection): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  for (const feature of boundaries.features) {
    const positions = feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates.flat(1)
      : feature.geometry.coordinates.flat(2);
    for (const [longitude, latitude] of positions) {
      bounds.extend([longitude, latitude]);
    }
  }
  return bounds.isEmpty() ? null : bounds;
}

function fitMapToBoundaries(map: maplibregl.Map, boundaries: BoundaryFeatureCollection): boolean {
  const bounds = getBoundaryBounds(boundaries);
  if (!bounds) return false;
  const padding = map.getContainer().clientWidth < 480 ? 12 : 48;
  map.fitBounds(bounds, { padding, maxZoom: 7, duration: 0 });
  return true;
}

export default function RiskMap({
  items,
  visibleBlockIds,
  layer,
  selectedBlockId,
  selectedDistrictId,
  selectedBlockFilter,
  riskFilter,
  hasSearchQuery,
  flyTarget,
  onSelect,
  onMapCoordinateSelect,
  language,
  mapStyle = "risk",
  userFarmBlockId,
}: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const mapStyleRef = useRef(mapStyle);
  const hasFitBoundariesRef = useRef(false);
  const languageRef = useRef(language);
  const [boundaries, setBoundaries] = useState<BoundaryFeatureCollection | null>(null);
  const [boundaryError, setBoundaryError] = useState(false);
  const [webGlSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  const getBoundaryGeoJson = useCallback((): StyledBoundaryCollection => {
    if (!boundaries) return EMPTY_BOUNDARIES;
    return {
      type: "FeatureCollection",
      features: boundaries.features.map((feature) => {
        const area = feature.properties;
        const linkedItem = area.risk_block_id
          ? items.find((item) => item.block_id === area.risk_block_id)
          : undefined;
        const risk = linkedItem ? layerRisk(linkedItem, layer) : "insufficient_data";
        const isSelected = area.risk_block_id === selectedBlockId;
        let isVisible = true;
        if (selectedDistrictId !== "all" && area.district_id !== selectedDistrictId) isVisible = false;
        if (selectedBlockFilter !== "all" && area.risk_block_id !== selectedBlockFilter) isVisible = false;
        if (riskFilter !== "all" && risk !== riskFilter) isVisible = false;
        if (hasSearchQuery && (!area.risk_block_id || !visibleBlockIds.includes(area.risk_block_id))) {
          isVisible = false;
        }
        if (isSelected) isVisible = true;

        return {
          ...feature,
          properties: {
            ...area,
            risk,
            riskColor: riskColor[risk],
            isSelected: isSelected ? 1 : 0,
            isUserFarm: area.risk_block_id === userFarmBlockId ? 1 : 0,
            isVisible: isVisible ? 1 : 0,
          },
        };
      }),
    };
  }, [
    boundaries,
    hasSearchQuery,
    items,
    layer,
    riskFilter,
    selectedBlockFilter,
    selectedBlockId,
    selectedDistrictId,
    userFarmBlockId,
    visibleBlockIds,
  ]);

  const onSelectRef = useRef(onSelect);
  const itemsRef = useRef(items);
  const onCoordinateSelectRef = useRef(onMapCoordinateSelect);
  const getBoundaryGeoJsonRef = useRef(getBoundaryGeoJson);

  useEffect(() => {
    onSelectRef.current = onSelect;
    itemsRef.current = items;
    onCoordinateSelectRef.current = onMapCoordinateSelect;
    getBoundaryGeoJsonRef.current = getBoundaryGeoJson;
  }, [items, onSelect, onMapCoordinateSelect, getBoundaryGeoJson]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    api.getRiskBoundaries()
      .then((payload) => {
        if (!isBoundaryFeatureCollection(payload)) {
          throw new Error("Boundary data did not match the expected GeoJSON schema.");
        }
        if (!cancelled) setBoundaries(payload);
      })
      .catch((error: unknown) => {
        console.error("Could not load Maharashtra taluka boundaries.", error);
        if (!cancelled) setBoundaryError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !webGlSupported) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "terrain-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          },
          "satellite-tiles": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: "Tiles &copy; Esri",
          },
        },
        layers: [
          {
            id: "risk-background",
            type: "background",
            paint: { "background-color": "#F6F4EC" },
          },
          {
            id: "terrain-layer",
            type: "raster",
            source: "terrain-tiles",
            layout: { visibility: mapStyleRef.current === "roads" ? "visible" : "none" },
          },
          {
            id: "satellite-layer",
            type: "raster",
            source: "satellite-tiles",
            layout: { visibility: mapStyleRef.current === "satellite" ? "visible" : "none" },
          },
        ],
      },
      center: [76.4, 19.2],
      zoom: 6,
      minZoom: 3.8,
      maxZoom: 13,
      maxBounds: [
        [70.5, 14.5],
        [82.5, 23.5],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-right");

    map.on("load", () => {
      const boundaryData = getBoundaryGeoJsonRef.current();
      map.addSource("areas-source", {
        type: "geojson",
        data: boundaryData,
      });

      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas-source",
        paint: {
          "fill-color": ["get", "riskColor"],
          "fill-opacity": [
            "case",
            ["==", ["get", "isVisible"], 1],
            ["case", ["==", ["get", "isSelected"], 1], 0.92, 0.84],
            0,
          ],
          "fill-outline-color": "#FFFFFF",
        },
      });

      map.addLayer({
        id: "areas-outline",
        type: "line",
        source: "areas-source",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "isSelected"], 1],
            "#13251D",
            ["==", ["get", "isUserFarm"], 1],
            "#E6A52E",
            "#FFFFFF",
          ],
          "line-width": [
            "case",
            ["==", ["get", "isSelected"], 1],
            3,
            ["==", ["get", "isUserFarm"], 1],
            2.5,
            1,
          ],
          "line-opacity": ["case", ["==", ["get", "isVisible"], 1], 0.95, 0],
        },
      });

      map.setLayoutProperty("terrain-layer", "visibility", mapStyleRef.current === "roads" ? "visible" : "none");
      map.setLayoutProperty("satellite-layer", "visibility", mapStyleRef.current === "satellite" ? "visible" : "none");
      hasFitBoundariesRef.current = fitMapToBoundaries(map, boundaryData);

      map.on("mouseenter", "areas-fill", (event: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature?.properties) return;
        popupRef.current?.remove();

        const content = document.createElement("div");
        content.style.padding = "4px 8px";
        content.style.fontSize = "12px";
        content.style.fontWeight = "600";
        const isMr = languageRef.current === "mr";
        const dataLabel = feature.properties.risk === "insufficient_data"
          ? (isMr ? "माहिती नाही" : "No data")
          : String(feature.properties.risk).replaceAll("_", " ");
        content.textContent = `${feature.properties.area_name}, ${feature.properties.district_name} · ${dataLabel}`;
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 8,
          className: "risk-map-popup",
        })
          .setLngLat(event.lngLat)
          .setDOMContent(content)
          .addTo(map);
      });

      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      map.on("click", "areas-fill", (event: maplibregl.MapLayerMouseEvent) => {
        const properties = event.features?.[0]?.properties;
        if (!properties) return;
        const blockId = typeof properties.risk_block_id === "string" ? properties.risk_block_id : null;
        const item = blockId ? itemsRef.current.find((entry) => entry.block_id === blockId) : undefined;
        if (item) {
          onSelectRef.current({
            ...item,
            geometry_type: "Polygon",
            coordinates_precision: "geoBoundaries_adm3_2018",
          });
          return;
        }

        onSelectRef.current({
          block_id: `boundary_${String(properties.shape_id)}`,
          block_name: String(properties.area_name),
          block_name_mr: String(properties.area_name),
          district_id: typeof properties.district_id === "string" ? properties.district_id : "unknown",
          district_name: String(properties.district_name),
          district_name_mr: String(properties.district_name),
          latitude: Number(properties.center_latitude),
          longitude: Number(properties.center_longitude),
          geometry_type: "Polygon",
          coordinates_precision: "geoBoundaries_adm3_2018",
          status: "unavailable",
          error: languageRef.current === "mr"
            ? "या तालुक्यासाठी या प्रणालीत हवामान जोखीम माहिती उपलब्ध नाही."
            : "No climate-risk summary is available for this taluka in the current dataset.",
        });
      });

      map.on("click", (event: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["areas-fill"] });
        if (features.length) return;
        const { lng, lat } = event.lngLat;
        if (lat >= 15.6 && lat <= 22.15 && lng >= 72.6 && lng <= 80.9) {
          onCoordinateSelectRef.current?.(lat, lng);
        }
      });
    });

    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [webGlSupported]);

  useEffect(() => {
    if (!boundaries || hasFitBoundariesRef.current) return;
    const map = mapRef.current;
    if (!map) return;
    const fit = () => {
      if (hasFitBoundariesRef.current) return;
      hasFitBoundariesRef.current = fitMapToBoundaries(map, boundaries);
    };
    if (map.loaded()) {
      fit();
    } else {
      map.once("load", fit);
    }
    return () => {
      map.off("load", fit);
    };
  }, [boundaries]);

  useEffect(() => {
    mapStyleRef.current = mapStyle;
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer("terrain-layer")) {
      map.setLayoutProperty("terrain-layer", "visibility", mapStyle === "roads" ? "visible" : "none");
    }
    if (map.getLayer("satellite-layer")) {
      map.setLayoutProperty("satellite-layer", "visibility", mapStyle === "satellite" ? "visible" : "none");
    }
  }, [mapStyle]);

  useEffect(() => {
    const source = mapRef.current?.getSource("areas-source") as maplibregl.GeoJSONSource | undefined;
    source?.setData(getBoundaryGeoJson());
  }, [getBoundaryGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBlockId) return;
    const item = items.find((entry) => entry.block_id === selectedBlockId);
    if (item) {
      map.flyTo({
        center: [item.longitude, item.latitude],
        zoom: Math.max(map.getZoom(), 9),
        speed: 1.2,
      });
    }
  }, [selectedBlockId, items]);

  useEffect(() => {
    if (!flyTarget) return;
    mapRef.current?.flyTo({
      center: flyTarget.center,
      zoom: flyTarget.zoom,
      speed: 1.3,
      curve: 1.4,
      essential: true,
    });
  }, [flyTarget]);

  if (!webGlSupported) {
    return (
      <div className="h-full overflow-y-auto bg-[var(--color-paper)] p-4" role="status">
        <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">
          {language === "mr"
            ? "या उपकरणावर नकाशा उपलब्ध नाही. खालील भाग निवडा."
            : "The map is not supported on this device. Choose an area from the list."}
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.block_id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="w-full rounded-lg border border-black/15 bg-white p-3 text-left text-sm"
              >
                {language === "mr" ? item.block_name_mr : item.block_name}, {item.district_name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="relative min-h-[420px] h-full w-full" aria-label="Maharashtra administrative risk map">
      <div className="absolute inset-0">
        <div ref={mapContainer} className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute right-4 top-4 z-10 flex h-16 w-12 flex-col items-center rounded-md border border-black/10 bg-white/95 pt-1.5 text-xs font-bold text-[#16231B] shadow"
        aria-label={language === "mr" ? "उत्तर दिशा" : "North"}
        title={language === "mr" ? "उत्तर" : "North"}
      >
        <span>N</span>
        <svg aria-hidden="true" width="18" height="30" viewBox="0 0 18 30">
          <path d="M9 1 17 26 9 21 1 26 9 1Z" fill="#16231B" />
          <path d="M9 21 17 26 9 29V21Z" fill="#89918B" />
        </svg>
      </div>
      {boundaryError && (
        <div role="alert" className="absolute left-3 right-3 top-3 z-10 rounded-lg border border-red-300 bg-white p-3 text-sm text-red-800">
          {language === "mr"
            ? "प्रशासकीय सीमा लोड झाल्या नाहीत. कृपया नकाशा पुन्हा लोड करा."
            : "Administrative boundaries could not be loaded. Reload the map to try again."}
        </div>
      )}
      {!boundaries && !boundaryError && (
        <div role="status" className="absolute left-3 top-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-sm shadow">
          {language === "mr" ? "तालुक्यांच्या सीमा लोड होत आहेत…" : "Loading taluka boundaries…"}
        </div>
      )}
    </div>
  );
}
