import type Decimal from "decimal.js-light";
import type { GameState } from "features/game/types/game";

/**
 * Returns the tax rate when withdrawing PYRA token
 * Flat 10% fee across all withdrawal amounts
 */
export function getTaxPercentage(amount?: Decimal) {
  return 10;
}

export function getTax({
  amount,
  game,
}: {
  amount: Decimal;
  game: GameState;
}): number {
  amount = amount.sub(game.bank.taxFreeSFL ?? 0);

  if (amount.lte(0)) return 0;

  const percentage = getTaxPercentage(amount);
  const tax = amount.mul(percentage / 100).toNumber();

  return tax;
}
