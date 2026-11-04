import Decimal from "decimal.js-light";

export const GEM_TO_COIN_RATIO = 50;

/**
 * Migrates legacy Gem inventory into the Playra coin economy.
 * Gem-only spend rewards and purchases are intentionally not restored.
 */
export function migrateGemBalance(farm: Record<string, any>): Record<string, any> {
  const inventory = { ...(farm.inventory ?? {}) };
  const gemBalance = inventory.Gem;
  const gems = gemBalance instanceof Decimal
    ? gemBalance
    : new Decimal(gemBalance ?? 0);

  const migratedCoins = new Decimal(farm.coins ?? 0).plus(gems.mul(GEM_TO_COIN_RATIO));
  delete inventory.Gem;

  return {
    ...farm,
    coins: migratedCoins.toNumber(),
    inventory,
    gems: {},
  };
}
