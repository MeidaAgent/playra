import type { GameState } from "features/game/types/game";
import { produce } from "immer";

export type NetworkName =
  | "Base"
  | "Base Sepolia"
  | "Polygon"
  | "Polygon Amoy"
  | "Robinhood"
  | "Robinhood Testnet"
  | "Ronin"
  | "Ronin Saigon";

export type UpdateNetworkAction = {
  type: "network.updated";
  network: NetworkName;
};

type Options = {
  state: Readonly<GameState>;
  action: UpdateNetworkAction;
  createdAt?: number;
};

export function updateNetwork({
  state,
  action,
  createdAt = Date.now(),
}: Options): GameState {
  return produce(state, (draft) => {
    draft.settings.network = action.network;
  });
}
