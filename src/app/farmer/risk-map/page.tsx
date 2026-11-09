"use client";

import RiskMapExperience from "@/features/risk-map/RiskMapExperience";
import { useAppState } from "@/hooks/useAppState";

export default function FarmerRiskMapPage() {
  const { location, hydrated } = useAppState();
  if (!hydrated) return null;
  return <RiskMapExperience initialBlockId={location.blockId} mode="farmer" />;
}
