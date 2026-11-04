import React, { useContext, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import giftIcon from "assets/icons/gift.png";
import { RoundButton } from "components/ui/RoundButton";
import { DailyStreakModal, isDailyRewardAvailable } from "features/game/components/dailyStreak/DailyStreakModal";
import { Context } from "features/game/GameProvider";
import { useSelector } from "@xstate/react";
import type { MachineState } from "features/game/lib/gameMachine";

const _farmId = (state: MachineState) => state.context.farmId;

export const DailyStreakButton: React.FC = () => {
  const { gameService } = useContext(Context);
  const farmId = useSelector(gameService, _farmId);
  const [isOpen, setIsOpen] = useState(false);

  const hasReward = isDailyRewardAvailable(farmId);

  return (
    <>
      <RoundButton onClick={() => setIsOpen(true)}>
        <img
          src={giftIcon}
          className="absolute group-active:translate-y-[2px]"
          style={{
            top: `${PIXEL_SCALE * 2.8}px`,
            left: `${PIXEL_SCALE * 3.4}px`,
            width: `${PIXEL_SCALE * 14.5}px`,
          }}
          alt="Daily Streak"
        />
        {hasReward && (
          <span
            className="absolute z-10 w-2.5 h-2.5 bg-green-500 border border-white rounded-full animate-ping"
            style={{
              top: `${PIXEL_SCALE * 1}px`,
              right: `${PIXEL_SCALE * 1}px`,
            }}
          />
        )}
      </RoundButton>
      <DailyStreakModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
