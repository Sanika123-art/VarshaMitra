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
  flyTarget,
  onSelect,
  onMapCoordinateSelect,
  language,
  mapStyle = "terrain",
  userFarmBlockId = "niphad",
}: {
  items: RiskSummaryItem[];
  layer: MapLayer;
  selectedBlockId: string | null;
  flyTarget?: { center: [number, number]; zoom: number; key: number } | null;
  onSelect: (item: RiskSummaryItem) => void;
  onMapCoordinateSelect?: (lat: number, lon: number) => void;
  language: "en" | "mr";
  mapStyle?: "terrain" | "satellite";
  userFarmBlockId?: string;
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
        const isUserFarm = item.block_id === userFarmBlockId;
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
            isUserFarm: isUserFarm ? 1 : 0,
          },
        };
      }),
    };
  }, [items, layer, selectedBlockId, userFarmBlockId, language]);

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
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
          },
          "satellite-tiles": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
          },
        },
        layers: [
          {
            id: "terrain-layer",
            type: "raster",
            source: "terrain-tiles",
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: mapStyle === "terrain" ? "visible" : "none",
            },
          },
          {
            id: "satellite-layer",
            type: "raster",
            source: "satellite-tiles",
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: mapStyle === "satellite" ? "visible" : "none",
            },
          },
        ],
      },
      center: [76.4, 19.2], // Calibrated center for complete Maharashtra framing
      zoom: 6.6,
      minZoom: 5.4,
      maxZoom: 15,
      maxBounds: [
        [70.5, 14.5], // Southwest coordinates (Arabian Sea / Goa border)
        [82.5, 23.5], // Northeast coordinates (Madhya Pradesh / Chhattisgarh border)
      ],
    });

    // Position navigation controls at bottom-right
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Add clustered geojson source
      map.addSource("blocks-source", {
        type: "geojson",
        data: getGeoJsonRef.current(),
        cluster: true,
        clusterMaxZoom: 8,
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
            "#2a583e", // 2-4 points
            5,
            "#1f4832", // 5-14 points
            15,
            "#163624", // 15+ points
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
          "circle-radius": 20,
          "circle-color": ["get", "riskColor"],
          "circle-opacity": 0.25,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": ["get", "riskColor"],
          "circle-stroke-opacity": 0.85,
        },
      });

      // 4. User Farm Beacon Halo Layer (Golden Pulsing Halo)
      map.addLayer({
        id: "user-farm-beacon-halo",
        type: "circle",
        source: "blocks-source",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isUserFarm"], 1]],
        paint: {
          "circle-radius": 24,
          "circle-color": "#E6A52E",
          "circle-opacity": 0.35,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#E6A52E",
          "circle-stroke-opacity": 0.9,
        },
      });

      // 5. Individual unclustered block markers
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
            8.5, 7,
            12, 9,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "isUserFarm"], 1],
            "#E6A52E", // Gold for logged-in user farm
            ["get", "riskColor"],
          ],
          "circle-opacity": 0.95,
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "isUserFarm"], 1],
            "#123C32",
            "#ffffff",
          ],
        },
      });

      // 6. User Farm Beacon Callout Text
      map.addLayer({
        id: "user-farm-beacon-text",
        type: "symbol",
        source: "blocks-source",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "isUserFarm"], 1]],
        layout: {
          "text-field": language === "mr" ? "📍 तुमचे शेत (सागर तळपदे)" : "📍 Your Farm (Sagar Talpade)",
          "text-size": 11,
          "text-offset": [0, -1.8],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": "#123C32",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
        },
      });

      // Cluster click: smooth expansion
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

      // Hover interaction on individual markers
      map.on("mouseenter", "blocks-point", (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature || !feature.properties) return;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const { name, district, risk, isUserFarm } = feature.properties;

        if (popupRef.current) popupRef.current.remove();

        const popupContainer = document.createElement("div");
        popupContainer.style.padding = "4px 8px";
        popupContainer.style.fontSize = "12px";
        popupContainer.style.fontWeight = "600";
        popupContainer.style.color = "#16261f";

        const titleDiv = document.createElement("div");
        titleDiv.textContent = isUserFarm
          ? `📍 ${name} (${district}) - ${language === "mr" ? "तुमचे शेत" : "Your Farm"}`
          : `${name} (${district})`;
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

      // Click interaction on arbitrary map points
      map.on("click", (e: maplibregl.MapMouseEvent) => {
        const rendered = map.queryRenderedFeatures(e.point, { layers: ["blocks-point", "clusters"] });
        if (rendered && rendered.length > 0) return;

        const { lng, lat } = e.lngLat;
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

  // Handle map style switching (Terrain vs Satellite)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer("terrain-layer")) {
      map.setLayoutProperty("terrain-layer", "visibility", mapStyle === "terrain" ? "visible" : "none");
    }
    if (map.getLayer("satellite-layer")) {
      map.setLayoutProperty("satellite-layer", "visibility", mapStyle === "satellite" ? "visible" : "none");
    }
  }, [mapStyle]);

  // Update source data whenever items, layer, selectedBlockId, userFarmBlockId, or language changes
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

  // Fly target handling
  useEffect(() => {
    if (!mapRef.current || !flyTarget) return;
    mapRef.current.flyTo({
      center: flyTarget.center,
      zoom: flyTarget.zoom,
      speed: 1.3,
      curve: 1.4,
      essential: true,
    });
  }, [flyTarget]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
