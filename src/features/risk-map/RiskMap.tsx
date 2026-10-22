"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { allBlocks } from "@/data/locations";
import { riskColor, riskLabelKey } from "@/lib/utils";
import type { MapLayer } from "./riskLayers";
import { layerRisk } from "./riskLayers";
import type { Block } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export default function RiskMap({
  layer,
  selectedBlockId,
  onSelect,
  language,
}: {
  layer: MapLayer;
  selectedBlockId: string | null;
  onSelect: (block: Block) => void;
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

  const blocks = allBlocks();

  // Generate GeoJSON FeatureCollection
  const getGeoJson = useCallback((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    return {
      type: "FeatureCollection",
      features: blocks.map((b) => {
        const risk = layerRisk(b, layer);
        const isSelected = b.id === selectedBlockId;
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [b.lng, b.lat],
          },
          properties: {
            id: b.id,
            name: language === "mr" ? b.nameMr : b.name,
            risk,
            riskColor: riskColor[risk],
            isSelected: isSelected ? 1 : 0,
            radius: isSelected ? 16 : risk === "critical" ? 13 : 10,
          },
        };
      }),
    };
  }, [blocks, layer, selectedBlockId, language]);

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

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
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: "carto-light-layer",
            type: "raster",
            source: "carto-light",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [75.5, 19.4], // Central Maharashtra
      zoom: 6.8,
      minZoom: 5.5,
      maxZoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Add geojson source
      map.addSource("blocks-source", {
        type: "geojson",
        data: getGeoJsonRef.current(),
      });

      // Selection halo layer (outer pulsating ring)
      map.addLayer({
        id: "blocks-halo",
        type: "circle",
        source: "blocks-source",
        filter: ["==", ["get", "isSelected"], 1],
        paint: {
          "circle-radius": 24,
          "circle-color": ["get", "riskColor"],
          "circle-opacity": 0.25,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "riskColor"],
          "circle-stroke-opacity": 0.6,
        },
      });

      // Block circle marker layer
      map.addLayer({
        id: "blocks-point",
        type: "circle",
        source: "blocks-source",
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["get", "riskColor"],
          "circle-opacity": 0.95,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Hover interaction
      map.on("mouseenter", "blocks-point", (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature || !feature.properties) return;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const { name, risk } = feature.properties;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: "risk-map-popup",
        })
          .setLngLat(coordinates)
          .setHTML(
            `<div style="padding: 4px 8px; font-size: 12px; font-weight: 600; color: #16261f;">
              <div>${name}</div>
              <div style="font-size: 11px; font-weight: 500; color: #5a6e63; text-transform: capitalize;">${risk} risk</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "blocks-point", () => {
        map.getCanvas().style.cursor = "";
        if (popupRef.current) popupRef.current.remove();
      });

      // Click interaction
      map.on("click", "blocks-point", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature || !feature.properties) return;
        const blockId = feature.properties.id;
        const targetBlock = blocksRef.current.find((b) => b.id === blockId);
        if (targetBlock) {
          onSelectRef.current(targetBlock);
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [webGlSupported]);

  // Update source data whenever layer, selectedBlockId, or language changes
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
    const target = blocks.find((b) => b.id === selectedBlockId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.lng, target.lat],
        zoom: Math.max(mapRef.current.getZoom(), 8.5),
        speed: 1.2,
      });
    }
  }, [selectedBlockId, blocks]);

  // WebGL Fallback interface
  if (!webGlSupported) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-paper-deep p-6 text-center">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-6 shadow-md">
          <h3 className="font-serif text-lg font-semibold text-ink">
            {t("riskMapPage.title")} · 2D Fallback
          </h3>
          <p className="mt-2 text-xs text-ink-muted">
            WebGL is not active in this browser environment. Showing block risk list directly:
          </p>
          <div className="mt-4 max-h-72 overflow-y-auto space-y-2 text-left">
            {blocks.map((b) => {
              const risk = layerRisk(b, layer);
              const isSelected = b.id === selectedBlockId;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelect(b)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                    isSelected ? "border-forest bg-forest-soft font-semibold" : "border-line bg-surface hover:bg-paper-deep"
                  }`}
                >
                  <span>{language === "mr" ? b.nameMr : b.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                    style={{ background: riskColor[risk] }}
                  >
                    {t(riskLabelKey[risk])}
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
