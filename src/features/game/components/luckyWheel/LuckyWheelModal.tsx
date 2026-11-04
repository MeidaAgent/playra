import React, { useContext, useState } from "react";
import { useSelector } from "@xstate/react";
import Decimal from "decimal.js-light";
import { Modal } from "components/ui/Modal";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { InnerPanel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Context } from "features/game/GameProvider";
import type { MachineState } from "features/game/lib/gameMachine";
import type { InventoryItemName } from "features/game/types/game";
import { ITEM_DETAILS } from "features/game/types/images";
import { formatNumber } from "lib/utils/formatNumber";

import tokenIcon from "assets/icons/token.png";
import randomIcon from "assets/icons/random_active.webp";
import coinsIcon from "assets/icons/coins.webp";

interface WheelPrize {
  id: number;
  name: string;
  type: "seed" | "coins" | "pyra";
  seedName?: InventoryItemName;
  amount: number;
  weight: number;
  color: string;
}

const SPIN_COST_PYRA = 5;

const PRIZES: WheelPrize[] = [
  {
    id: 0,
    name: "10x Cauliflower Seed",
    type: "seed",
    seedName: "Cauliflower Seed",
    amount: 10,
    weight: 20,
    color: "#4ade80",
  },
  {
    id: 1,
    name: "15x Parsnip Seed",
    type: "seed",
    seedName: "Parsnip Seed",
    amount: 15,
    weight: 18,
    color: "#60a5fa",
  },
  {
    id: 2,
    name: "10x Eggplant Seed",
    type: "seed",
    seedName: "Eggplant Seed",
    amount: 10,
    weight: 16,
    color: "#c084fc",
  },
  {
    id: 3,
    name: "10x Radish Seed",
    type: "seed",
    seedName: "Radish Seed",
    amount: 10,
    weight: 15,
    color: "#f87171",
  },
  {
    id: 4,
    name: "20x Wheat Seed",
    type: "seed",
    seedName: "Wheat Seed",
    amount: 20,
    weight: 14,
    color: "#fde047",
  },
  {
    id: 5,
    name: "10x Kale Seed",
    type: "seed",
    seedName: "Kale Seed",
    amount: 10,
    weight: 10,
    color: "#34d399",
  },
  {
    id: 6,
    name: "500 Gold Coins",
    type: "coins",
    amount: 500,
    weight: 12,
    color: "#fb923c",
  },
  {
    id: 7,
    name: "Jackpot 25 $PYRA",
    type: "pyra",
    amount: 25,
    weight: 5,
    color: "#e11d48",
  },
];

const _state = (state: MachineState) => state.context.state;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyWheelModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { gameService } = useContext(Context);
  const state = useSelector(gameService, _state);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winningPrize, setWinningPrize] = useState<WheelPrize | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userBalance = state.balance ?? new Decimal(0);

  // Pick prize by weight
  const pickRandomPrize = (): WheelPrize => {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const prize of PRIZES) {
      if (rand < prize.weight) return prize;
      rand -= prize.weight;
    }
    return PRIZES[0];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (userBalance.lessThan(SPIN_COST_PYRA)) {
      setErrorMsg(`Insufficient $PYRA. A spin costs ${SPIN_COST_PYRA} $PYRA.`);
      return;
    }

    setErrorMsg(null);
    setWinningPrize(null);
    setIsSpinning(true);

    const prize = pickRandomPrize();
    const prizeIndex = PRIZES.findIndex((p) => p.id === prize.id);

    // Calculate rotation: 8 slices = 45 degrees per slice
    // Pointer is at the top (270 deg or 0 deg offset)
    const sliceAngle = 360 / PRIZES.length;
    const targetSliceCenter = prizeIndex * sliceAngle + sliceAngle / 2;
    // 5 full spins (1800 deg) + offset to align target slice with top pointer
    const totalNewRotation =
      rotationAngle + 1800 + (360 - (targetSliceCenter % 360));

    setRotationAngle(totalNewRotation);

    // Apply spin payment immediately: deduct 5 $PYRA
    let updatedBalance = userBalance.sub(SPIN_COST_PYRA);
    gameService.send("UPDATE", {
      state: {
        ...state,
        balance: updatedBalance,
      },
    });

    // Wait for wheel animation to stop (3.5 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      setWinningPrize(prize);

      // Distribute prize
      const finalInventory = { ...state.inventory };
      let finalBalance = updatedBalance;
      let finalCoins = state.coins ?? 0;

      if (prize.type === "seed" && prize.seedName) {
        const currentCount =
          finalInventory[prize.seedName] ?? new Decimal(0);
        finalInventory[prize.seedName] = currentCount.add(prize.amount);
      } else if (prize.type === "coins") {
        finalCoins += prize.amount;
      } else if (prize.type === "pyra") {
        finalBalance = finalBalance.add(prize.amount);
      }

      gameService.send("UPDATE", {
        state: {
          ...state,
          balance: finalBalance,
          inventory: finalInventory,
          coins: finalCoins,
        },
      });
    }, 3600);
  };

  return (
    <Modal show={isOpen} onHide={isSpinning ? () => {} : onClose}>
      <CloseButtonPanel title="Lucky Harvest Wheel" onClose={isSpinning ? () => {} : onClose}>
        <div className="flex flex-col space-y-2 p-1 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Label type="vibrant" icon={randomIcon}>
              Gacha Seed Spin
            </Label>
            <Label type="formula" icon={tokenIcon}>
              Cost: {SPIN_COST_PYRA} $PYRA
            </Label>
          </div>

          <div className="flex items-center justify-between px-1 text-xxs text-gray-300">
            <span>
              Your Balance:{" "}
              <b className="text-yellow-300">
                {formatNumber(userBalance, { decimalPlaces: 2 })} $PYRA
              </b>
            </span>
            <span className="text-red-400 font-bold">
              80% Fee Burned (Deflationary)
            </span>
          </div>

          {errorMsg && (
            <InnerPanel className="p-1 text-center text-xxs font-bold text-red-400">
              <span>{errorMsg}</span>
            </InnerPanel>
          )}

          {winningPrize && (
            <InnerPanel className="p-1.5 text-center text-xs font-bold text-yellow-300 bg-yellow-950/40 border-yellow-400 animate-pulse">
              <span>Congratulations! You won {winningPrize.name}!</span>
            </InnerPanel>
          )}

          {/* Spinning Wheel Graphic Container */}
          <div className="relative flex flex-col items-center justify-center my-2">
            {/* Top Indicator Arrow */}
            <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-yellow-300 drop-shadow-md" />

            {/* Wheel Canvas / Circle */}
            <div
              className="relative w-56 h-56 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl transition-transform duration-[3500ms] ease-out"
              style={{
                transform: `rotate(${rotationAngle}deg)`,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {PRIZES.map((prize, idx) => {
                  const angle = 360 / PRIZES.length;
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={prize.id}
                      d={pathData}
                      fill={prize.color}
                      stroke="#27272a"
                      strokeWidth="0.8"
                    />
                  );
                })}
              </svg>

              {/* Wheel Center Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-yellow-900 border-2 border-yellow-400 flex items-center justify-center shadow-lg">
                  <img src={randomIcon} className="w-6 h-6" alt="spin" />
                </div>
              </div>
            </div>
          </div>

          {/* Prize Pool Legend */}
          <div className="grid grid-cols-2 gap-1 bg-brown-700/50 p-1.5 rounded text-xxs">
            {PRIZES.map((prize) => {
              const icon =
                prize.type === "seed" && prize.seedName
                  ? ITEM_DETAILS[prize.seedName]?.image
                  : prize.type === "coins"
                  ? coinsIcon
                  : tokenIcon;

              return (
                <div key={prize.id} className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: prize.color }}
                  />
                  {icon && <img src={icon} className="w-3.5 h-3.5 flex-shrink-0" alt="icon" />}
                  <span className="truncate text-gray-200">{prize.name}</span>
                </div>
              );
            })}
          </div>

          {/* Spin CTA Button */}
          <div className="pt-1">
            <Button
              disabled={isSpinning || userBalance.lessThan(SPIN_COST_PYRA)}
              onClick={handleSpin}
              className="w-full text-xs py-2"
            >
              {isSpinning
                ? "Spinning the Wheel..."
                : userBalance.lessThan(SPIN_COST_PYRA)
                ? `Insufficient $PYRA (${SPIN_COST_PYRA} Required)`
                : `Spin Wheel (5 $PYRA)`}
            </Button>
          </div>
        </div>
      </CloseButtonPanel>
    </Modal>
  );
};
