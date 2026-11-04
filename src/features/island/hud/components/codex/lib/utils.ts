import {
  FISH,
  type FishName,
  type FishType,
  type MarineMarvelName,
} from "features/game/types/fishing";
import { getKeys } from "lib/object";
import {
  FLOWERS,
  type FlowerName,
  type FlowerSeedName,
} from "features/game/types/flowers";
import { getObjectEntries } from "lib/object";

export type ItemCounts = {
  available: number;
  owned: number;
};

export const getFishByType = () => {
  const fishByType: Record<FishType, (FishName | MarineMarvelName)[]> = {
    basic: [],
    advanced: [],
    expert: [],
    "marine marvel": [],
    chapter: [],
  };

  getKeys(FISH).forEach((fishName) => {
    const fish = FISH[fishName];
    fishByType[fish.type].push(fishName);
  });

  return fishByType;
};

export function getFishSection(fishName: FishName | MarineMarvelName): string {
  const fishByType = getFishByType();
  for (const [type, fishList] of Object.entries(fishByType)) {
    if (fishList.includes(fishName)) {
      return `fish-${type}`;
    }
  }
  return "fish-common";
}

export const getFlowerBySeed = () => {
  const flowersBySeed: Record<FlowerSeedName, FlowerName[]> = {
    "Sunpetal Seed": [],
    "Bloom Seed": [],
    "Lily Seed": [],
    "Edelweiss Seed": [],
    "Gladiolus Seed": [],
    "Lavender Seed": [],
    "Clover Seed": [],
  };

  getKeys(FLOWERS).forEach((flowerName) => {
    const flower = FLOWERS[flowerName];
    flowersBySeed[flower.seed].push(flowerName);
  });

  return flowersBySeed;
};

export const getEncyclopediaFish = () => {
  const encyclopediaFish: (FishName | MarineMarvelName)[] = [];
  getObjectEntries(FISH).forEach(([fishName, fish]) => {
    if (fish.type !== "marine marvel" && fish.type !== "chapter") {
      encyclopediaFish.push(fishName);
    }
  });
  return encyclopediaFish;
};
