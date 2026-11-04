/* eslint-disable react/jsx-no-undef */
import React, { useContext, useState } from "react";
import { Balances } from "components/Balances";
import { useActor, useSelector } from "@xstate/react";
import { Context } from "features/game/GameProvider";
import { Settings } from "./components/Settings";
import { Inventory } from "./components/inventory/Inventory";
import { Save } from "./components/Save";
import { placeEvent } from "features/game/expansion/placeable/landscapingMachine";
import { TravelButton } from "./components/deliveries/TravelButton";
import { VersionUpdateWidget } from "./components/VersionUpdateWidget";
import type { PlaceableLocation } from "features/game/types/collectibles";
import { HudContainer } from "components/ui/HudContainer";
import Decimal from "decimal.js-light";
import { CurrenciesModal } from "./components/CurrenciesModal";
import type { MachineState } from "features/game/lib/gameMachine";
import { useSound } from "lib/utils/hooks/useSound";
import { TransactionCountdown } from "./Transaction";
import { MarketplaceButton } from "./components/MarketplaceButton";
import { PowerSkillsButton } from "./components/PowerSkillsButton";
import {
  type BumpkinRevampSkillName,
  getPowerSkills,
} from "features/game/types/bumpkinSkills";
import { LandscapeButton } from "./components/LandscapeButton";
import { InteriorFloorNav } from "features/interior/components/InteriorFloorNav";
import { InteriorBedsButton } from "features/interior/components/InteriorBedsButton";
import { HudBumpkin } from "./components/bumpkinProfile/HudBumpkin";
import { DailyStreakButton } from "./components/DailyStreakButton";
import { LuckyWheelButton } from "./components/LuckyWheelButton";

/**
 * Heads up display - a concept used in games for the small overlaid display of information.
 * Balances, Inventory, actions etc.
 */
const HudComponent: React.FC<{
  isFarming: boolean;
  moveButtonsUp?: boolean;
  location: PlaceableLocation;
}> = ({ isFarming, location }) => {
  const { gameService, shortcutItem, selectedItem } = useContext(Context);
  const [gameState] = useActor(gameService);

  const [showBuyCurrencies, setShowBuyCurrencies] = useState(false);

  const sfl = useSound("sfl");

  const autosaving = gameState.matches("autosaving");

  const handleCurrenciesModal = () => {
    sfl.play();
    setShowBuyCurrencies(!showBuyCurrencies);
  };

  const isFullUser = true;
  const isTutorial = gameState.context.state.island.type === "basic";

  const bumpkin = gameState.context.state.bumpkin;
  const skills = bumpkin?.skills ?? {};
  const hasPowerSkills = getPowerSkills().some(
    (skill) => !!skills[skill.name as BumpkinRevampSkillName],
  );

  return (
    <HudContainer>
      <div className="absolute left-0 top-0 bottom-0 p-2.5">
        <HudBumpkin isTutorial={isTutorial} />
      </div>

      <div className="absolute bottom-0 p-2.5 left-0 flex flex-col space-y-2.5">
        <DailyStreakButton />
        <LuckyWheelButton />
        {hasPowerSkills && <PowerSkillsButton />}
        <MarketplaceButton />
        {location === "interior" && <InteriorFloorNav floor="ground" />}
        {location === "level_one" && <InteriorFloorNav floor="level_one" />}
        <TravelButton location={location} />
      </div>

      <div className="absolute bottom-0 pb-2 pl-3 left-16 flex flex-col items-start space-y-2.5">
        <TransactionCountdown />
        <VersionUpdateWidget />
      </div>

      {/* Right side of the HUD */}
      <div className="absolute right-0 top-0 p-2.5">
        <Balances
          sfl={gameState.context.state.balance}
          coins={gameState.context.state.coins}
          gems={gameState.context.state.inventory["Gem"] ?? new Decimal(0)}
          onClick={handleCurrenciesModal}
        />
      </div>
      <div className="absolute right-0 top-16 p-2.5 flex flex-col space-y-2.5">
        {isFarming && <LandscapeButton location={location} />}
        <Inventory
          state={gameState.context.state}
          isFullUser={isFullUser}
          shortcutItem={shortcutItem}
          selectedItem={selectedItem}
          onPlace={(selected) => {
            gameService.send("LANDSCAPE", {
              action: placeEvent(selected, location),
              placeable: { name: selected },
              multiple: true,
              location,
            });
          }}
          onPlaceNFT={(id, nft) => {
            gameService.send("LANDSCAPE", {
              action: "nft.placed",
              placeable: { id, name: nft },
              location,
            });
          }}
          onPlaceFarmHand={(id) => {
            gameService.send("LANDSCAPE", {
              action: "farmHand.placed",
              placeable: { name: "FarmHand", id },
              multiple: true,
              location,
            });
          }}
          isSaving={autosaving}
          isFarming={isFarming}
          hideActions={false}
          location={location}
        />
        {(location === "interior" || location === "level_one") && (
          <InteriorBedsButton />
        )}
      </div>

      <div className="absolute bottom-0 p-2 right-0 flex flex-col space-y-2.5">
        <Save />
        <Settings isFarming={false} />
      </div>

      <CurrenciesModal
        show={showBuyCurrencies}
        onClose={handleCurrenciesModal}
      />
    </HudContainer>
  );
};

export const Hud = React.memo(HudComponent);
