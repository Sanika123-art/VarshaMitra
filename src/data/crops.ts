import type { Crop } from "@/types";

export const crops: Crop[] = [
  {
    id: "soybean",
    nameKey: "crops.soybean",
    icon: "Sprout",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "flowering", nameKey: "cropStages.flowering" },
      { id: "grainFill", nameKey: "cropStages.grainFill" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
  {
    id: "cotton",
    nameKey: "crops.cotton",
    icon: "Flower2",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "flowering", nameKey: "cropStages.flowering" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
  {
    id: "onion",
    nameKey: "crops.onion",
    icon: "CircleDot",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
  {
    id: "sugarcane",
    nameKey: "crops.sugarcane",
    icon: "Wheat",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "grainFill", nameKey: "cropStages.grainFill" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
  {
    id: "jowar",
    nameKey: "crops.jowar",
    icon: "Wheat",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "flowering", nameKey: "cropStages.flowering" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
  {
    id: "tur",
    nameKey: "crops.tur",
    icon: "Sprout",
    stages: [
      { id: "sowing", nameKey: "cropStages.sowing" },
      { id: "vegetative", nameKey: "cropStages.vegetative" },
      { id: "flowering", nameKey: "cropStages.flowering" },
      { id: "harvest", nameKey: "cropStages.harvest" },
    ],
  },
];

export function getCrop(cropId: string): Crop | undefined {
  return crops.find((c) => c.id === cropId);
}
