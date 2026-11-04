import React, { useContext, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import tradeIcon from "assets/icons/trade.png";
import lockIcon from "assets/icons/lock.png";
import { RoundButton } from "components/ui/RoundButton";
import { useMarketplaceNavigation } from "features/marketplace/lib/navigation";
import { Context } from "features/game/GameProvider";
import { useSelector } from "@xstate/react";
import { getTotalBumpkinLevel } from "features/game/lib/level";
import type { MachineState } from "features/game/lib/gameMachine";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";

const _bumpkin = (state: MachineState) => state.context.state.bumpkin;

export const MarketplaceButton = () => {
  const { gameService } = useContext(Context);
  const { openMarketplace } = useMarketplaceNavigation();
  const bumpkin = useSelector(gameService, _bumpkin);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const bumpkinLevel = bumpkin
    ? getTotalBumpkinLevel({
        experience: bumpkin.experience,
        ascensionLevel: 0,
      })
    : 1;

  const isLocked = bumpkinLevel < 5;

  return (
    <>
      <RoundButton
        onClick={() => {
          if (isLocked) {
            setShowLockedModal(true);
            return;
          }
          openMarketplace();
        }}
      >
        <img
          src={tradeIcon}
          className="absolute group-active:translate-y-[2px]"
          style={{
            top: `${PIXEL_SCALE * 2.6}px`,
            left: `${PIXEL_SCALE * 3.4}px`,
            width: `${PIXEL_SCALE * 15.5}px`,
            opacity: isLocked ? 0.7 : 1,
          }}
        />
        {isLocked && (
          <img
            src={lockIcon}
            className="absolute z-10"
            style={{
              top: `${PIXEL_SCALE * 0.5}px`,
              right: `${PIXEL_SCALE * 0.5}px`,
              width: `${PIXEL_SCALE * 6}px`,
            }}
          />
        )}
      </RoundButton>

      <Modal show={showLockedModal} onHide={() => setShowLockedModal(false)}>
        <Panel>
          <div className="p-1">
            <div className="flex items-center justify-between mb-2">
              <Label type="danger" icon={lockIcon}>
                Marketplace Locked
              </Label>
              <Label type="default">Level {bumpkinLevel} / 5</Label>
            </div>
            <p className="text-sm mb-2 text-white">
              Bumpkin Level 5 is required to access the P2P Marketplace.
            </p>
            <p className="text-xs mb-3 text-neutral-400">
              Cook delicious meals at the Fire Pit and feed your Bumpkin to gain XP and unlock player-to-player trading.
            </p>
            <Button onClick={() => setShowLockedModal(false)}>Got it</Button>
          </div>
        </Panel>
      </Modal>
    </>
  );
};
