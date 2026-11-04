import React, { useContext, useState } from "react";
import { Balances } from "components/Balances";
import { useSelector } from "@xstate/react";
import { Context } from "features/game/GameProvider";
import { Inventory } from "./components/inventory/Inventory";
import Decimal from "decimal.js-light";
import { Save } from "./components/Save";
import { Settings } from "./components/Settings";
import { TravelButton } from "./components/deliveries/TravelButton";
import { DailyStreakButton } from "./components/DailyStreakButton";
import { LuckyWheelButton } from "./components/LuckyWheelButton";
import { VersionUpdateWidget } from "./components/VersionUpdateWidget";
import { HudContainer } from "components/ui/HudContainer";
import { ModalContext } from "features/game/components/modal/ModalProvider";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useLocation } from "react-router";
import { TransactionCountdown } from "./Transaction";
import { MarketplaceButton } from "./components/MarketplaceButton";

import { FloatingIslandCountdown } from "./components/FloatingIslandCountdown";
import { CommunityGameCountdown } from "features/giveaway/ui/CommunityGameCountdown";
import { HudBumpkin } from "./components/bumpkinProfile/HudBumpkin";
import type { MachineState } from "features/game/lib/gameMachine";
import { DesertDiggingDisplay } from "./components/DesertDiggingDisplay";
/**
 * Heads up display - a concept used in games for the small overlaid display of information.
 * Balances, Inventory, actions etc.
 */

type Props = {
  scene: string;
  server?: string;
};

const _autosaving = (state: MachineState) => state.matches("autosaving");
const _farmAddress = (state: MachineState) => state.context.farmAddress;
const _linkedWallet = (state: MachineState) => state.context.linkedWallet;
const _isTutorial = (state: MachineState) =>
  state.context.state.island.type === "basic";
const _state = (state: MachineState) => state.context.state;

const HudComponent: React.FC<Props> = ({ server, scene }) => {
  const { t } = useAppTranslation();
  const { gameService, shortcutItem, selectedItem } = useContext(Context);
  const { openModal } = useContext(ModalContext);

  const autosaving = useSelector(gameService, _autosaving);
  const farmAddress = useSelector(gameService, _farmAddress);
  const linkedWallet = useSelector(gameService, _linkedWallet);
  const isTutorial = useSelector(gameService, _isTutorial);
  const state = useSelector(gameService, _state);

  const { pathname } = useLocation();

  const handleCurrenciesModal = () => {
    openModal("BUY_GEMS");
  };

  return (
    <>
      <HudContainer>
        <div className="absolute left-0 top-0 bottom-0 p-2.5">
          <HudBumpkin isTutorial={isTutorial} />
        </div>
        {/* Left side of the HUD with translation */}

        <div className="absolute bottom-0 p-2.5 left-0 flex flex-col space-y-2.5">
          <DailyStreakButton />
          <LuckyWheelButton />
          <MarketplaceButton />
          <TravelButton />
        </div>

        {pathname.includes("beach") && <DesertDiggingDisplay />}

        <div className="absolute bottom-0 pb-2 pl-3 left-16 flex flex-col space-y-2.5">
          <TransactionCountdown />
          {/* Community games widget — only while in the Kingdom (polls every 30s). */}
          {scene === "kingdom" && <CommunityGameCountdown />}
          <FloatingIslandCountdown />
          <VersionUpdateWidget />
        </div>

        {/* Right side of the HUD*/}

        <div className="absolute right-0 top-0 p-2.5">
          <Balances
            onClick={farmAddress ? handleCurrenciesModal : undefined}
            sfl={state.balance}
            coins={state.coins}
            gems={state.inventory["Gem"] ?? new Decimal(0)}
          />
        </div>

        <div className="absolute right-0 top-16 p-2.5">
          <Inventory
            state={state}
            isFullUser={true}
            shortcutItem={shortcutItem}
            selectedItem={selectedItem}
            isSaving={autosaving}
            isFarming={false}
            hideActions={
              pathname.includes("retreat") ||
              pathname.includes("visit") ||
              pathname.includes("dawn-breaker")
            }
          />
        </div>

        <div className="absolute bottom-0 p-2.5 right-0 flex flex-col space-y-2.5">
          <Save />
          <Settings isFarming={false} />
        </div>
      </HudContainer>
    </>
  );
};

export const WorldHud = React.memo(HudComponent);
