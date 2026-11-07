"use client";

import { useAppState } from "@/hooks/useAppState";
import { useTranslation } from "@/i18n/LanguageContext";
import { getBlock, getDistrict } from "@/data/locations";
import { pickName } from "@/lib/utils";

/** Localized names for the user's selected location (state, district, block). */
export function useLocationLabel() {
  const { location, farmerProfile } = useAppState();
  const { language } = useTranslation();
  const block = getBlock(location.blockId);
  const district = getDistrict(location.districtId);

  let blockName = location.blockName;
  if (language === "mr" && location.blockNameMr) {
    blockName = location.blockNameMr;
  } else if (block) {
    blockName = pickName(block, language);
  }

  let districtName = location.districtName;
  if (language === "mr" && location.districtNameMr) {
    districtName = location.districtNameMr;
  } else if (district) {
    districtName = pickName(district, language);
  }

  const stateName = language === "mr" ? "महाराष्ट्र" : "Maharashtra";

  const villageName = language === "mr"
    ? (farmerProfile?.villageNameMr || farmerProfile?.villageName)
    : (farmerProfile?.villageName);

  const full = villageName
    ? `${villageName}, ${blockName}`
    : `${blockName}, ${districtName}`;

  return { blockName, districtName, stateName, villageName, full };
}
