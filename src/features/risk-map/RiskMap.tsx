"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riskColor, riskLabelKey } from "@/lib/utils";
import type { MapLayer } from "./riskLayers";
import { layerRisk } from "./riskLayers";
import type { RiskSummaryItem } from "@/lib/api/types";
import { useTranslation } from "@/i18n/LanguageContext";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export default function RiskMap({
  items,
  layer,
  selectedBlockId,
  onSelect,
  onMapCoordinateSelect,
  language,
}: {
  items: RiskSummaryItem[];
  layer: MapLayer;
  selectedBlockId: string | null;
  onSelect: (item: RiskSummaryItem) => void;
  onMapCoordinateSelect?: (lat: number, lon: number) => void;
  language: "en" | "mr";
}) {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [webGlSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  // Generate GeoJSON FeatureCollection directly from backend summary items
  const getGeoJson = useCallback((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    return {
      type: "FeatureCollection",
      features: items.map((item) => {
        const risk = layerRisk(item, layer);
        const isSelected = item.block_id === selectedBlockId;
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.longitude, item.latitude],
          },
          properties: {
            id: item.block_id,
            name: language === "mr" ? item.block_name_mr : item.block_name,
            district: item.district_name,
            risk,
            riskColor: riskColor[risk] ?? "#718096",
            isSelected: isSelected ? 1 : 0,
          },
        };
      }),
    };
  }, [items, layer, selectedBlockId, language]);

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const onMapCoordinateSelectRef = useRef(onMapCoordinateSelect);
  useEffect(() => {
    onMapCoordinateSelectRef.current = onMapCoordinateSelect;
  }, [onMapCoordinateSelect]);

  const getGeoJsonRef = useRef(getGeoJson);
  useEffect(() => {
    getGeoJsonRef.current = getGeoJson;
  }, [getGeoJson]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !webGlSupported) return;

    const customTileUrl =
      typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAP_TILE_URL
        ? process.env.NEXT_PUBLIC_MAP_TILE_URL
        : null;

    const tileUrls = customTileUrl
      ? [customTileUrl]
      : [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-raster-tiles": {
            type: "raster",
            tiles: tileUrls,
            tileSize: 256,
            maxzoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-raster-layer",
            type: "raster",
            source: "osm-raster-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [75.5, 19.4], // Central Maharashtra
      zoom: 6.8,
      minZoom: 5.5,
      maxZoom: 15,
    });

    // Position navigation controls at bottom-right so they never collide with top toolbar or sidebar panels
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Add clustered geojson source
      map.addSource("blocks-source", {
        type: "geojson",
        data: getGeoJsonRef.current(),
        cluster: true,
        clusterMaxZoom: 8, // Cluster at statewide view; progressively uncluster at district/taluka view (> 8)
        clusterRadius: 40,
      });

      // 1. Clustered circles layer
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "blocks-source",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#2a583e", // 2-4 points: refined forest green
            5,
            "#1f4832", // 5-14 points: deeper forest
            15,
            "#163624", // 15+ points: dark evergreen
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            5,
            19,
            15,
            24,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
          "circle-opacity": 0.92,
        },
      });

      // 2. Cluster count text layer
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "blocks-source",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 11,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // 3. Selection halo layer for active individual marker
      map.addLayer({
        id: "blocks-halo",
        type: "circle",
        source: "blocks-source",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isSelected"], 1]],
        paint: {
          "circle-radius": 18,
          "circle-color": ["get", "riskColor"],
          "circle-opacity": 0.22,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "riskColor"],
          "circle-stroke-opacity": 0.75,
        },
      });

      // 4. Individual unclustered block markers (restrained, zoom-scaled)
      map.addLayer({
        id: "blocks-point",
        type: "circle",
        source: "blocks-source",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 5,
            8.5, 6.5,
            12, 8.5,
          ],
          "circle-color": ["get", "riskColor"],
          "circle-opacity": 0.95,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster click: smooth expansion / zoom into cluster bounds
      map.on("click", "clusters", async (e: maplibregl.MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("blocks-source") as maplibregl.GeoJSONSource | undefined;
        if (source && clusterId !== undefined) {
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const coordinates = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coordinates, zoom: Math.min(zoom, 10.5), duration: 450 });
          } catch {
            map.easeTo({ center: e.lngLat, zoom: map.getZoom() + 2, duration: 350 });
          }
        }
      });

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Hover interaction on individual markers with safe DOM creation
      map.on("mouseenter", "blocks-point", (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature || !feature.properties) return;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const { name, district, risk } = feature.properties;

        if (popupRef.current) popupRef.current.remove();

        const popupContainer = document.createElement("div");
        popupContainer.style.padding = "4px 8px";
        popupContainer.style.fontSize = "12px";
        popupContainer.style.fontWeight = "600";
        popupContainer.style.color = "#16261f";

        const titleDiv = document.createElement("div");
        titleDiv.textContent = `${name} (${district})`;
        popupContainer.appendChild(titleDiv);

        const subDiv = document.createElement("div");
        subDiv.style.fontSize = "11px";
        subDiv.style.fontWeight = "500";
        subDiv.style.color = "#5a6e63";
        subDiv.style.textTransform = "capitalize";
        subDiv.textContent = `${risk.replace("_", " ")} risk`;
        popupContainer.appendChild(subDiv);

        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          className: "risk-map-popup",
        })
          .setLngLat(coordinates)
          .setDOMContent(popupContainer)
          .addTo(map);
      });

      map.on("mouseleave", "blocks-point", () => {
        map.getCanvas().style.cursor = "";
        if (popupRef.current) popupRef.current.remove();
      });

      // Click interaction on individual block markers
      map.on("click", "blocks-point", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature || !feature.properties) return;
        const blockId = feature.properties.id;
        const targetItem = itemsRef.current.find((b) => b.block_id === blockId);
        if (targetItem) {
          onSelectRef.current(targetItem);
        }
      });

      // Click interaction on arbitrary map points across Maharashtra
      map.on("click", (e: maplibregl.MapMouseEvent) => {
        const rendered = map.queryRenderedFeatures(e.point, { layers: ["blocks-point", "clusters"] });
        if (rendered && rendered.length > 0) return; // handled by markers or clusters

        const { lng, lat } = e.lngLat;
        // Maharashtra bounding box check: 15.60N to 22.15N, 72.60E to 80.90E
        if (lat >= 15.60 && lat <= 22.15 && lng >= 72.60 && lng <= 80.90) {
          if (onMapCoordinateSelectRef.current) {
            onMapCoordinateSelectRef.current(lat, lng);
          }
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [webGlSupported]);

  // Update source data whenever items, layer, selectedBlockId, or language changes
  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource("blocks-source") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(getGeoJson());
    }
  }, [getGeoJson]);

  // Center on selected block
  useEffect(() => {
    if (!mapRef.current || !selectedBlockId) return;
    const target = items.find((b) => b.block_id === selectedBlockId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 9),
        speed: 1.2,
      });
    }
  }, [selectedBlockId, items]);

  // WebGL Fallback interface
  if (!webGlSupported) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-paper-deep p-6 text-center">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-6 shadow-md">
          <h3 className="font-serif text-lg font-semibold text-ink">
            {t("riskMapPage.title")} · 2D Fallback
          </h3>
          <p className="mt-2 text-xs text-ink-muted">
            WebGL is not active in this browser environment. Showing backend block risk list directly:
          </p>
          <div className="mt-4 max-h-72 overflow-y-auto space-y-2 text-left">
            {items.map((b) => {
              const risk = layerRisk(b, layer);
              const isSelected = b.block_id === selectedBlockId;
              return (
                <button
                  key={b.block_id}
                  onClick={() => onSelect(b)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                    isSelected ? "border-forest bg-forest-soft font-semibold" : "border-line bg-surface hover:bg-paper-deep"
                  }`}
                >
                  <span>{language === "mr" ? b.block_name_mr : b.block_name} ({b.district_name})</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                    style={{ background: riskColor[risk] ?? "#718096" }}
                  >
                    {t(riskLabelKey[risk] ?? "common.insufficientData")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
