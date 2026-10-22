"use client";

import { useAppState } from "@/hooks/useAppState";
import { useTranslation } from "@/i18n/LanguageContext";
import { getBlock, getDistrict, stateInfo } from "@/data/locations";
import { pickName } from "@/lib/utils";

/** Localized names for the user's selected location (state, district, block). */
export function useLocationLabel() {
  const { location } = useAppState();
  const { language } = useTranslation();
  const block = getBlock(location.blockId);
  const district = getDistrict(location.districtId);
  const blockName = block ? pickName(block, language) : location.blockName;
  const districtName = district ? pickName(district, language) : location.districtName;
  const stateName = pickName(stateInfo, language);
  return { blockName, districtName, stateName, full: `${blockName}, ${districtName}` };
}
