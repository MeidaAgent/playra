import React, { useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import randomIcon from "assets/icons/random_active.webp";
import { RoundButton } from "components/ui/RoundButton";
import { LuckyWheelModal } from "features/game/components/luckyWheel/LuckyWheelModal";

export const LuckyWheelButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <RoundButton onClick={() => setIsOpen(true)}>
        <img
          src={randomIcon}
          className="absolute group-active:translate-y-[2px]"
          style={{
            top: `${PIXEL_SCALE * 2.8}px`,
            left: `${PIXEL_SCALE * 3}px`,
            width: `${PIXEL_SCALE * 15}px`,
          }}
          alt="Lucky Wheel"
        />
      </RoundButton>
      <LuckyWheelModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
