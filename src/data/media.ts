/**
 * Photography used in the UI, with licensing details.
 *
 * All photographs are from Wikimedia Commons and licensed under Creative Commons
 * (CC BY / CC BY-SA). Files in /public/images are resized copies. The credits are
 * shown on the About page — keep this list in sync with any image you add.
 */

export interface ImageCredit {
  id: string;
  /** Wikimedia Commons file title. */
  title: string;
  author: string;
  license: "CC BY-SA 3.0" | "CC BY-SA 4.0" | "CC BY 4.0";
  licenseUrl: string;
  sourceUrl: string;
}

const BY_SA_3 = "https://creativecommons.org/licenses/by-sa/3.0";
const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0";

const credit = (
  id: string,
  title: string,
  author: string,
  license: ImageCredit["license"],
  commonsFile: string
): ImageCredit => ({
  id,
  title,
  author,
  license,
  licenseUrl: license === "CC BY-SA 3.0" ? BY_SA_3 : BY_SA_4,
  sourceUrl: `https://commons.wikimedia.org/wiki/File:${commonsFile}`,
});

export const credits = {
  farmerSowing: credit(
    "farmerSowing",
    "Farmer sowing rice in Western Ghat Maharashtra.jpg",
    "Phadke09",
    "CC BY-SA 4.0",
    "Farmer_sowing_rice_in_Western_Ghat_Maharashtra.jpg"
  ),
  monsoonFarms: credit(
    "monsoonFarms",
    "Monsoon clouds over farms.jpg",
    "Abhi",
    "CC BY-SA 3.0",
    "Monsoon_clouds_over_farms.jpg"
  ),
  soybean: credit(
    "soybean",
    "Soyabean field.jpg",
    "Albert Deccan",
    "CC BY-SA 3.0",
    "Soyabean_field.jpg"
  ),
  soybeanHarvest: credit(
    "soybeanHarvest",
    "Soyabean Harvsting in Rural Maharashtra, India.jpg",
    "Valisport24",
    "CC BY-SA 4.0",
    "Soyabean_Harvsting_in_Rural_Maharashtra,_India.jpg"
  ),
  cotton: credit(
    "cotton",
    "Closeup image of a cotton field in Raichur Karnataka.jpg",
    "Nabina Chakraborty, WELL Labs",
    "CC BY-SA 4.0",
    "Closeup_image_of_a_cotton_field_in_Raichur_Karnataka.jpg"
  ),
  sugarcane: credit(
    "sugarcane",
    "Trees and sugarcane fields, Western Ghats, Maharashtra (2013).jpg",
    "akshaybapat4",
    "CC BY-SA 4.0",
    "Trees_and_sugarcane_fields,_Western_Ghats,_Maharashtra_(2013).jpg"
  ),
  tur: credit(
    "tur",
    "Cajanus cajan-1-pattypadi-yercaud-salem-India.JPG",
    "Yercaud-elango",
    "CC BY-SA 4.0",
    "Cajanus_cajan-1-pattypadi-yercaud-salem-India.JPG"
  ),
  onion: credit("onion", "Onion3.jpg", "Nishaexport", "CC BY-SA 3.0", "Onion3.jpg"),
} as const;

/** Editorial photographs (not tied to a crop). `altKey` is an i18n key. */
export const photos = {
  farmerSowing: { src: "/images/farmer-sowing.jpg", altKey: "media.farmerSowing", credit: credits.farmerSowing },
  monsoonFarms: { src: "/images/monsoon-farms.jpg", altKey: "media.monsoonFarms", credit: credits.monsoonFarms },
} as const;

export interface CropPhoto {
  src: string;
  /** Crop stages this photo genuinely depicts. */
  stages: string[];
  /** i18n key describing what the photo shows (used in the caption). */
  showsKey: string;
  credit: ImageCredit;
}

/**
 * Reference photos per crop. A photo is only offered for a crop stage it actually
 * depicts, so an image never implies a condition it does not show. Crops without a
 * suitable licensed photo (e.g. jowar) fall back to an icon tile.
 */
const cropPhotoSets: Record<string, CropPhoto[]> = {
  soybean: [
    { src: "/images/soybean.jpg", stages: ["sowing", "vegetative"], showsKey: "cropPhoto.youngCrop", credit: credits.soybean },
    { src: "/images/soybean-harvest.jpg", stages: ["harvest"], showsKey: "cropPhoto.harvest", credit: credits.soybeanHarvest },
  ],
  cotton: [
    { src: "/images/cotton.jpg", stages: ["harvest"], showsKey: "cropPhoto.openBolls", credit: credits.cotton },
  ],
  sugarcane: [
    { src: "/images/sugarcane.jpg", stages: ["vegetative"], showsKey: "cropPhoto.standingCrop", credit: credits.sugarcane },
  ],
  tur: [
    { src: "/images/tur.jpg", stages: ["flowering"], showsKey: "cropPhoto.flowering", credit: credits.tur },
  ],
  onion: [
    { src: "/images/onion.jpg", stages: ["harvest"], showsKey: "cropPhoto.harvestedLoad", credit: credits.onion },
  ],
};

/** Stage-matched photo for the advisory/dashboard panels. */
export function cropPhotoFor(cropId: string, stageId: string): CropPhoto | undefined {
  return cropPhotoSets[cropId]?.find((p) => p.stages.includes(stageId));
}

/** Any photo that identifies the crop, for picker thumbnails (caption states what it shows). */
export function cropThumb(cropId: string): CropPhoto | undefined {
  return cropPhotoSets[cropId]?.[0];
}

/** Every credit actually used in the UI, for the About page. */
export const usedCredits: ImageCredit[] = [
  credits.farmerSowing,
  credits.monsoonFarms,
  credits.soybean,
  credits.soybeanHarvest,
  credits.cotton,
  credits.sugarcane,
  credits.tur,
  credits.onion,
];
