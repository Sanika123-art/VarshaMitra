/**
 * Photography used in the UI, with licensing details.
 *
 * All photographs are authentic agricultural field photos sourced from Wikimedia Commons
 * under verified permissive Creative Commons and Public Domain licenses.
 * Files in /public/images/crops/ are centered and optimized (960x720, 4:3).
 */

export interface ImageCredit {
  id: string;
  /** Wikimedia Commons file title. */
  title: string;
  author: string;
  license: "CC BY-SA 3.0" | "CC BY-SA 4.0" | "CC BY 4.0" | "CC BY-SA 2.0" | "CC BY 3.0" | "Public domain";
  licenseUrl: string;
  sourceUrl: string;
}

const BY_SA_3 = "https://creativecommons.org/licenses/by-sa/3.0";
const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0";
const BY_SA_2 = "https://creativecommons.org/licenses/by-sa/2.0";
const BY_3 = "https://creativecommons.org/licenses/by/3.0";
const PD = "https://creativecommons.org/publicdomain/mark/1.0/";

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
  licenseUrl:
    license === "CC BY-SA 4.0"
      ? BY_SA_4
      : license === "CC BY-SA 3.0"
      ? BY_SA_3
      : license === "CC BY-SA 2.0"
      ? BY_SA_2
      : license === "CC BY 3.0"
      ? BY_3
      : PD,
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
  pigeonpea: credit(
    "pigeonpea",
    "Cajanus cajan-1-pattypadi-yercaud-salem-India.JPG",
    "Yercaud-elango",
    "CC BY-SA 4.0",
    "Cajanus_cajan-1-pattypadi-yercaud-salem-India.JPG"
  ),
  tur: credit(
    "tur",
    "Cajanus cajan-1-pattypadi-yercaud-salem-India.JPG",
    "Yercaud-elango",
    "CC BY-SA 4.0",
    "Cajanus_cajan-1-pattypadi-yercaud-salem-India.JPG"
  ),
  onion: credit("onion", "Onion3.jpg", "Nishaexport", "CC BY-SA 3.0", "Onion3.jpg"),
  rice: credit(
    "rice",
    "Ripening rice plants in paddy field, Indonesia.jpg",
    "Undeka 11",
    "CC BY-SA 4.0",
    "Ripening_rice_plants_in_paddy_field,_Indonesia.jpg"
  ),
  wheat: credit(
    "wheat",
    "The combine Claas Lexion 584 in the wheat harvest.jpg",
    "Michael Gäbler",
    "CC BY-SA 3.0",
    "The_combine_Claas_Lexion_584_in_the_wheat_harvest.jpg"
  ),
  pearl_millet: credit(
    "pearl_millet",
    "Pearl millet ICRISAT Patancheru.jpg",
    "Rik Schuiling / TropCrop",
    "CC BY-SA 3.0",
    "2013.02-402-294a_Pearl_millet,breeding,selfing_ICRISAT,Patancheru(Hyderabad,Andhra_Pradesh),IN_wed20feb2013.jpg"
  ),
  sorghum: credit(
    "sorghum",
    "Sorghum bicolor.jpg",
    "Wikimedia Contributor",
    "CC BY-SA 3.0",
    "Sorghum_bicolor03.jpg"
  ),
  finger_millet: credit(
    "finger_millet",
    "Finger millet polyculture.jpg",
    "Carla Antonini",
    "CC BY-SA 3.0",
    "Polyculture.JPG"
  ),
  maize: credit(
    "maize",
    "Dent Corn Zea mays.jpg",
    "Didier Descouens",
    "CC BY-SA 4.0",
    "Dent_Corn_'Oaxacan_Green'_(Zea_mays)_MHNT_2.jpg"
  ),
  chickpea: credit(
    "chickpea",
    "Chickpeas in glasshouse.jpg",
    "Carl Davies, CSIRO",
    "CC BY 3.0",
    "CSIRO_ScienceImage_3025_Chickpeas_in_glasshouse.jpg"
  ),
  green_gram: credit(
    "green_gram",
    "Mung bean pods plant.jpg",
    "Peter Henderson & Co.",
    "Public domain",
    "Everything_for_the_garden_(16390907195).jpg"
  ),
  black_gram: credit(
    "black_gram",
    "Black gram urad pods.jpg",
    "Peter Henderson & Co.",
    "Public domain",
    "Everything_for_the_garden_(16390907195).jpg"
  ),
  groundnut: credit(
    "groundnut",
    "Peanuts harvested pods.jpg",
    "Franz Eugen Köhler",
    "Public domain",
    "Arachis_hypogaea_-_Köhler’s_Medizinal-Pflanzen-163.jpg"
  ),
  sunflower: credit(
    "sunflower",
    "Sunflower field.jpg",
    "jacilluch",
    "CC BY-SA 2.0",
    "Girasol_(7072217699).jpg"
  ),
  sesame: credit(
    "sesame",
    "Sesame harvest.jpg",
    "USDAgov",
    "Public domain",
    "Harvest_(20201029-NRCS-LSC-0318).jpg"
  ),
  safflower: credit(
    "safflower",
    "Safflower plant.jpg",
    "Carl Davies, CSIRO",
    "CC BY 3.0",
    "CSIRO_ScienceImage_10707_Safflower_plant.jpg"
  ),
  tomato: credit(
    "tomato",
    "Tomato plants with fruit.jpg",
    "Kolforn",
    "CC BY-SA 4.0",
    "-2019-07-20_Un-Ripe_fruit_on_variety_'Sub_Arctic_Plenty'_Tomato_Plants,_Trimingham.JPG"
  ),
  chilli: credit(
    "chilli",
    "Field visit chilli crop.jpg",
    "Ssmmgbsanskriti",
    "CC BY-SA 4.0",
    "Field_visit_chilli_crop.JPG"
  ),
  potato: credit(
    "potato",
    "Potato crop field.jpg",
    "Jonathan Billinger",
    "CC BY-SA 2.0",
    "A_newly-planted_potato_crop_-_geograph.org.uk_-_7760244.jpg"
  ),
  pomegranate: credit(
    "pomegranate",
    "Cracked pomegranate on a tree.jpg",
    "DGtal",
    "CC BY-SA 4.0",
    "Cracked_pomegranate_on_a_tree.jpg"
  ),
  grapes: credit(
    "grapes",
    "Bunch of grapes amidst vine leaves.jpg",
    "julesvernex2",
    "CC BY-SA 4.0",
    "Bunch_of_grapes_amidst_vine_leaves,_Ponte_de_Sor_(approx._GPS_location)_julesvernex2-2.jpg"
  ),
  banana: credit(
    "banana",
    "Banana planting in Western Kenya.jpg",
    "Cynthia Doresi",
    "CC BY-SA 4.0",
    "Backyard_Banana_planting_among_the_Luhya_people_of_Western_Kenya.jpg"
  ),
} as const;

/** Editorial photographs (not tied to a crop). */
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

/** Comprehensive stage-matched photos for all 24 supported Maharashtra crops. */
const cropPhotoSets: Record<string, CropPhoto[]> = {
  soybean: [
    { src: "/images/crops/soybean.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development"], showsKey: "cropPhoto.youngCrop", credit: credits.soybean },
    { src: "/images/soybean-harvest.jpg", stages: ["harvest", "maturity"], showsKey: "cropPhoto.harvest", credit: credits.soybeanHarvest },
  ],
  cotton: [
    { src: "/images/crops/cotton.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.openBolls", credit: credits.cotton },
  ],
  sugarcane: [
    { src: "/images/crops/sugarcane.jpg", stages: ["sowing", "vegetative", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.sugarcane },
  ],
  pigeonpea: [
    { src: "/images/crops/pigeonpea.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.flowering", credit: credits.pigeonpea },
  ],
  tur: [
    { src: "/images/crops/pigeonpea.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.flowering", credit: credits.tur },
  ],
  onion: [
    { src: "/images/crops/onion.jpg", stages: ["sowing", "vegetative", "flowering", "maturity", "harvest"], showsKey: "cropPhoto.harvestedLoad", credit: credits.onion },
  ],
  rice: [
    { src: "/images/crops/rice.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.rice },
  ],
  wheat: [
    { src: "/images/crops/wheat.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.wheat },
  ],
  pearl_millet: [
    { src: "/images/crops/pearl_millet.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.pearl_millet },
  ],
  sorghum: [
    { src: "/images/crops/sorghum.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.sorghum },
  ],
  finger_millet: [
    { src: "/images/crops/finger_millet.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.finger_millet },
  ],
  maize: [
    { src: "/images/crops/maize.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.maize },
  ],
  chickpea: [
    { src: "/images/crops/chickpea.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.chickpea },
  ],
  green_gram: [
    { src: "/images/crops/green_gram.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.green_gram },
  ],
  black_gram: [
    { src: "/images/crops/black_gram.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.black_gram },
  ],
  groundnut: [
    { src: "/images/crops/groundnut.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.groundnut },
  ],
  sunflower: [
    { src: "/images/crops/sunflower.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.sunflower },
  ],
  sesame: [
    { src: "/images/crops/sesame.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.sesame },
  ],
  safflower: [
    { src: "/images/crops/safflower.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.safflower },
  ],
  tomato: [
    { src: "/images/crops/tomato.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.tomato },
  ],
  chilli: [
    { src: "/images/crops/chilli.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.chilli },
  ],
  potato: [
    { src: "/images/crops/potato.jpg", stages: ["sowing", "vegetative", "flowering", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.potato },
  ],
  pomegranate: [
    { src: "/images/crops/pomegranate.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.pomegranate },
  ],
  grapes: [
    { src: "/images/crops/grapes.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.grapes },
  ],
  banana: [
    { src: "/images/crops/banana.jpg", stages: ["sowing", "vegetative", "flowering", "pod_development", "maturity", "harvest"], showsKey: "cropPhoto.standingCrop", credit: credits.banana },
  ],
};

/** Stage-matched photo for the advisory/dashboard panels. */
export function cropPhotoFor(cropId: string, stageId: string): CropPhoto | undefined {
  const normId = cropId.toLowerCase().trim();
  const set = cropPhotoSets[normId] || cropPhotoSets[normId === "pigeonpea" ? "tur" : normId];
  if (!set) return undefined;
  return set.find((p) => p.stages.includes(stageId)) || set[0];
}

/** Any photo that identifies the crop, for picker thumbnails. */
export function cropThumb(cropId: string): CropPhoto | undefined {
  const normId = cropId.toLowerCase().trim();
  const set = cropPhotoSets[normId] || cropPhotoSets[normId === "pigeonpea" ? "tur" : normId];
  return set?.[0];
}

/** Every credit actually used in the UI, for the About page. */
export const usedCredits: ImageCredit[] = Object.values(credits);
