"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import { allBlocks } from "@/data/locations";
import { riskColor } from "@/lib/utils";
import type { MapLayer } from "./riskLayers";
import { layerRisk } from "./riskLayers";
import type { Block } from "@/types";

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
  const blocks = allBlocks();

  return (
    <MapContainer
      center={[18.9, 75.3]}
      zoom={7}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl={false}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {/* Label layer on top */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      />
      {blocks.map((block) => {
        const risk = layerRisk(block, layer);
        const active = block.id === selectedBlockId;
        const isCritical = risk === "critical";
        return (
          <CircleMarker
            key={block.id}
            center={[block.lat, block.lng]}
            radius={active ? 16 : isCritical ? 12 : 10}
            pathOptions={{
              color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
              weight: active ? 2.5 : 1.5,
              fillColor: riskColor[risk],
              fillOpacity: active ? 0.95 : 0.8,
              ...(active
                ? { dashArray: undefined }
                : {}),
            }}
            eventHandlers={{ click: () => onSelect(block) }}
          >
            <LeafletTooltip direction="top" offset={[0, -8]} opacity={1}>
              <span className="font-medium">
                {language === "mr" ? block.nameMr : block.name}
              </span>
            </LeafletTooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
